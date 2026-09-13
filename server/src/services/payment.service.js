import { logger } from '../config/logger.js';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { WalletLedgerEntry } from '../models/WalletLedgerEntry.js';
import { SIMULATED_PROVIDER } from '../config/constants.js';
import crypto from 'node:crypto';
import { Payment } from '../models/Payment.js';
import { Transaction } from '../models/Transaction.js';
import { Wallet } from '../models/Wallet.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { Refund } from '../models/Refund.js';
import { Milestone } from '../models/Milestone.js';
import { Project } from '../models/Project.js';
import { Contract } from '../models/Contract.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/index.js';
import { getPaymentProvider } from '../integrations/payment/index.js';
import { virtualCardService } from './virtualCard.service.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { PAYMENT_STATUS, ESCROW_STATUS, MILESTONE_STATUS, CONTRACT_STATUS } from '../config/constants.js';

const sid = (v) => String(v);
const ref = (prefix = 'TH-TXN') => `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
const number = (prefix) => `${prefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}-${crypto.randomBytes(2).toString('hex')}`;
const cents = (value) => Math.round(Number(value || 0) * 100);
const fee = (gross) => Math.max(0, Math.round(cents(gross) * config.payment.feePercentage / 100) + cents(config.payment.fixedFee));
async function wallet(user) { return Wallet.findOneAndUpdate({ user }, { $setOnInsert: { user, currency: config.payment.currency } }, { upsert: true, new: true }); }
async function accessPayment(user, paymentId) { const p = await Payment.findById(paymentId); if (!p) throw ApiError.notFound('Payment not found'); if (![p.client, p.freelancer].some((x) => sid(x) === sid(user._id))) throw ApiError.notFound('Payment not found'); return p; }

export const paymentService = {
  verifyWebhookSignature(payload, signature) {
    if (!config.payment.webhookSecret) return config.payment.provider === 'mock';
    if (!signature) return false;
    const expected = crypto.createHmac('sha256', config.payment.webhookSecret).update(JSON.stringify(payload)).digest('hex');
    return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  },
  async fundMilestone(user, milestoneId, idempotencyKey, provider = 'BKASH_SIMULATED', outcome = 'success') {
    const actor = await User.findById(user._id);
    if (!actor?.hasRole('client')) throw ApiError.forbidden('Only clients can fund milestones');
    if (!idempotencyKey || idempotencyKey.length > 180) throw ApiError.badRequest('A valid Idempotency-Key is required');
    if (!Object.values(SIMULATED_PROVIDER).includes(provider)) throw ApiError.badRequest('Unsupported payment method');
    if (!['success', 'failed'].includes(outcome) || (config.isProd && outcome !== 'success')) throw ApiError.badRequest('Invalid simulation outcome');
    // Provision the authenticated client's own card before escrow debits so the card and ledger stay synchronized.
    await virtualCardService.ensureForUser(actor);
    let result;
    try {
      await mongoose.connection.transaction(async (session) => {
        const m = await Milestone.findById(milestoneId).session(session);
        if (!m) throw ApiError.notFound('Milestone not found');
        const project = await Project.findById(m.project).session(session);
        const contract = await Contract.findById(m.contract).session(session);
        if (!project || sid(project.client) !== sid(user._id)) throw ApiError.forbidden('Only the project client can fund this milestone');
        if (!contract || sid(contract.client) !== sid(project.client) || sid(contract._id) !== sid(project.contract) || sid(contract.freelancer) !== sid(project.freelancer)) throw ApiError.badRequest('Milestone contract does not match the project');
        const priorAttempt = await PaymentTransaction.findOne({ idempotencyKey }).session(session);
        if (priorAttempt) {
          if (sid(priorAttempt.user) !== sid(user._id) || sid(priorAttempt.milestoneId) !== sid(m._id)) throw ApiError.conflict('Idempotency key is already in use');
          result = await Payment.findById(priorAttempt.metadata.payment).session(session); return;
        }
        let payment = await Payment.findOne({ milestone: m._id }).session(session);
        if (payment && ![PAYMENT_STATUS.FAILED, PAYMENT_STATUS.CANCELLED].includes(payment.status)) {
          if (payment.status === PAYMENT_STATUS.CHECKOUT_CREATED && !payment.processAfter) {
            await queueLegacyPayment(payment, session);
          }
          result = payment; return;
        }
        if (project.deletedAt || contract.status !== CONTRACT_STATUS.ACTIVE) throw ApiError.badRequest('Contract is not active');
        if (![MILESTONE_STATUS.PENDING, MILESTONE_STATUS.FUNDING_PENDING].includes(m.status)) throw ApiError.badRequest('Milestone is not eligible for funding');
        const gross = cents(m.amount), fees = fee(m.amount);
        if (!Number.isSafeInteger(gross) || gross <= 0 || fees > gross) throw ApiError.badRequest('Invalid milestone amount or fees');
        const intent = await getPaymentProvider().createPaymentIntent({ amount: gross, currency: config.payment.currency, metadata: { milestone: sid(m._id) } });
        const values = { transactionReference: ref(), client: project.client, freelancer: contract.freelancer, project: project._id, contract: contract._id, milestone: m._id, job: contract.job, provider, paymentMethod: provider, providerPaymentId: intent.id, amount: gross / 100, amountMinor: gross, currency: config.payment.currency, platformFee: fees / 100, freelancerAmount: (gross - fees) / 100, status: PAYMENT_STATUS.CHECKOUT_CREATED, escrowStatus: ESCROW_STATUS.FUNDING_PENDING, idempotencyKey, simulationOutcome: outcome, processAfter: new Date(Date.now() + 1200), failureReason: undefined, processingAt: undefined, completedAt: undefined };
        if (payment) { Object.assign(payment, values); await payment.save({ session }); }
        else [payment] = await Payment.create([{ ...values, paymentNumber: number('PAY') }], { session });
        await PaymentTransaction.create([{ transactionNumber: payment.transactionReference, transactionReference: payment.transactionReference, user: project.client, clientId: project.client, developerId: contract.freelancer, projectId: project._id, contractId: contract._id, milestoneId: m._id, amount: payment.amount, amountMinor: gross, currency: payment.currency, paymentMethod: provider, provider, providerTransactionId: intent.id, type: 'client_payment', status: 'pending', idempotencyKey, metadata: { payment: payment._id } }], { session });
        m.status = MILESTONE_STATUS.FUNDING_PENDING; m.paymentState = 'funding_pending'; await m.save({ session });
        result = payment;
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      const payment = await Payment.findOne({ milestone: milestoneId, client: user._id });
      if (!payment) throw ApiError.conflict('Payment key is already in use');
      result = payment;
    }
    return result;
  },
  async simulateFundMilestone(user, milestoneId, outcome, key, provider) { return this.fundMilestone(user, milestoneId, key, provider, outcome); },
  async processPending(io) {
    const legacy = await Payment.find({ status: PAYMENT_STATUS.CHECKOUT_CREATED, processAfter: mongoose.trusted({ $exists: false }) }).limit(25);
    for (const row of legacy) await mongoose.connection.transaction(async session => { const p = await Payment.findById(row._id).session(session); if (p && !p.processAfter && p.status === PAYMENT_STATUS.CHECKOUT_CREATED) await queueLegacyPayment(p, session); });
    const pending = await Payment.find({ status: mongoose.trusted({ $in: [PAYMENT_STATUS.CHECKOUT_CREATED, PAYMENT_STATUS.PROCESSING] }), processAfter: mongoose.trusted({ $lte: new Date() }) }).select('_id').limit(50);
    for (const row of pending) {
      let updated, notices = [];
      await mongoose.connection.transaction(async (session) => {
        updated = null; notices = [];
        const p = await Payment.findById(row._id).select('+simulationOutcome').session(session);
        if (!p || p.processAfter > new Date() || ![PAYMENT_STATUS.CHECKOUT_CREATED, PAYMENT_STATUS.PROCESSING].includes(p.status)) return;
        if (p.status === PAYMENT_STATUS.CHECKOUT_CREATED) {
          p.status = PAYMENT_STATUS.PROCESSING; p.processingAt = new Date(); p.processAfter = new Date(Date.now() + 1800);
          await PaymentTransaction.updateOne({ idempotencyKey: p.idempotencyKey }, { $set: { status: 'processing' } }, { session });
        } else {
          const failed = p.simulationOutcome === 'failed';
          p.status = failed ? PAYMENT_STATUS.FAILED : PAYMENT_STATUS.SUCCEEDED;
          p.escrowStatus = failed ? ESCROW_STATUS.NOT_FUNDED : ESCROW_STATUS.FUNDED;
          p.completedAt = new Date(); p.failureReason = failed ? 'Payment provider simulation failed. No funds were collected.' : undefined;
          if (!failed) p.paidAt = p.completedAt;
          await PaymentTransaction.updateOne({ idempotencyKey: p.idempotencyKey }, { $set: { status: failed ? 'failed' : 'success', completedAt: p.completedAt } }, { session });
          await Milestone.updateOne({ _id: p.milestone }, { $set: { status: failed ? MILESTONE_STATUS.PENDING : MILESTONE_STATUS.FUNDED, paymentState: failed ? 'not_ready' : 'funded' } }, { session });
          if (!failed) {
            await Transaction.create([{ transactionNumber: number('TXN'), user: p.client, payment: p._id, project: p.project, contract: p.contract, milestone: p.milestone, type: 'escrow_funding', direction: 'debit', amount: p.amount, amountMinor: p.amountMinor, currency: p.currency, description: 'Milestone funds held in escrow' }], { session });
            await virtualCardService.debitForEscrow(p.client, p.amount, p._id, { project: p.project, contract: p.contract, milestone: p.milestone }, session);
          }
          for (const recipient of failed ? [p.client] : [p.client, p.freelancer]) {
            const [notice] = await Notification.create([{ recipient, type: failed ? 'PAYMENT_FAILED' : 'ESCROW_FUNDED', category: 'payment', title: failed ? 'Payment failed' : 'Milestone escrow funded', body: failed ? p.failureReason : `${p.amount} ${p.currency} is held in escrow until approved and released.`, entityType: 'Payment', entityId: p._id, actionUrl: `/dashboard/payments/${p._id}` }], { session }); notices.push(notice);
          }
        }
        await p.save({ session }); updated = p;
      });
      if (updated) {
        const event = updated.status === PAYMENT_STATUS.SUCCEEDED ? 'payment:success' : updated.status === PAYMENT_STATUS.FAILED ? 'payment:failed' : 'payment:processing';
        emitPayment(io, updated, event);
        if (updated.status === PAYMENT_STATUS.SUCCEEDED) {
          emitPayment(io, updated, 'escrow:funded');
          emitPayment(io, updated, 'milestone:funded');
          io?.to(`user:${updated.client}`).emit('transaction:new', { payment: publicPayment(updated) });
          io?.to(`user:${updated.client}`).emit('card:updated', { payment: publicPayment(updated) });
          io?.to(`user:${updated.client}`).emit('wallet:updated', {});
        }
      }
      for (const n of notices) io?.to(`user:${n.recipient}`).emit('notification:new', { notification: n });
    }
  },
  async list(user) { return Payment.find({ $or: [{ client: user._id }, { freelancer: user._id }] }).select('-metadata -providerPaymentId -idempotencyKey -freelancerAmount').populate('project contract milestone', 'title').populate('freelancer', 'name').sort({ createdAt: -1 }); },
  async getOne(user, paymentId) {
    const payment = await accessPayment(user, paymentId);
    await payment.populate('project contract milestone', 'title'); await payment.populate('freelancer', 'name');
    const result = publicPayment(payment);
    result.attempts = await PaymentTransaction.find({ 'metadata.payment': payment._id, type: 'client_payment' }).select('transactionReference amount currency provider status createdAt completedAt').sort({ createdAt: -1 });
    return result;
  },
  async webhook() { throw ApiError.badRequest('Simulated payments are settled by the server worker'); },
  async release(user, milestoneId, io) {
    let result, released;
    await mongoose.connection.transaction(async (session) => {
      const m = await Milestone.findById(milestoneId).session(session);
      if (!m) throw ApiError.notFound('Milestone not found');
      const project = await Project.findById(m.project).session(session);
      const actor = await User.findById(user._id).session(session);
      if (!actor?.hasRole('client') || sid(project.client) !== sid(user._id)) throw ApiError.forbidden('Only the client can release funds');
      const p = await Payment.findOne({ milestone: m._id }).session(session);
      if (!p) throw ApiError.badRequest('Milestone has not been funded');
      const prior = await Transaction.findOne({ payment: p._id, type: 'escrow_release' }).session(session);
      if (prior) { result = prior; return; }
      if (p.status !== PAYMENT_STATUS.SUCCEEDED || p.escrowStatus !== ESCROW_STATUS.FUNDED || m.status !== MILESTONE_STATUS.APPROVED) throw ApiError.badRequest('Funded milestone must be approved before release');
      const w = await Wallet.findOneAndUpdate({ user: p.freelancer }, { $setOnInsert: { user: p.freelancer, currency: p.currency } }, { session, upsert: true, new: true });
      const before = w.pendingBalance; w.pendingBalance = (cents(before) + cents(p.freelancerAmount)) / 100; w.totalEarned = (cents(w.totalEarned) + cents(p.freelancerAmount)) / 100; await w.save({ session });
      await virtualCardService.creditEarning(p.freelancer, p.freelancerAmount, p._id, { project: p.project, contract: p.contract, milestone: p.milestone }, session);
      await virtualCardService.releaseEscrow(p.client, p.amount, p._id, { project: p.project, contract: p.contract, milestone: p.milestone }, session);
      [result] = await Transaction.create([{ transactionNumber: number('TXN'), user: p.freelancer, payment: p._id, project: p.project, contract: p.contract, milestone: p.milestone, type: 'escrow_release', direction: 'credit', amount: p.freelancerAmount, amountMinor: cents(p.freelancerAmount), currency: p.currency, balanceBefore: before, balanceAfter: w.pendingBalance, description: 'Approved milestone earnings credited to virtual card' }], { session });
      p.escrowStatus = ESCROW_STATUS.RELEASED; await p.save({ session }); m.paymentState = 'paid'; m.status = MILESTONE_STATUS.PAID; await m.save({ session }); released = p;
      await Notification.create([{ recipient: p.freelancer, type: 'ESCROW_RELEASED', title: 'Earnings credited', body: `${p.freelancerAmount} ${p.currency} credited to your virtual card.`, actionUrl: '/dashboard/card' }], { session });
    });
    if (released) {
      emitPayment(io, released, 'escrow:released');
      io?.to(`user:${released.freelancer}`).emit('developer:earning', { payment: publicPayment(released) });
      io?.to(`user:${released.freelancer}`).emit('wallet:updated', {});
      io?.to(`user:${released.freelancer}`).emit('card:updated', { payment: publicPayment(released) });
      io?.to(`user:${released.client}`).emit('wallet:updated', {});
      io?.to(`user:${released.client}`).emit('card:updated', { payment: publicPayment(released) });
      io?.to(`user:${released.client}`).emit('transaction:new', { payment: publicPayment(released) });
    }
    return result;
  },
  async getWallet(user) { return wallet(user._id); },
  async transactions(user) { return Transaction.find({ user: user._id }).sort({ createdAt: -1 }); },
  async withdraw(user, { amount, method, destinationReference }, idempotencyKey) { if (!idempotencyKey) throw ApiError.badRequest('Idempotency-Key is required'); const old = await Withdrawal.findOne({ idempotencyKey }); if (old) return old; const w = await wallet(user._id); const minor = cents(amount); if (w.status !== 'active' || minor <= 0 || minor > cents(w.availableBalance)) throw ApiError.badRequest('Insufficient available balance'); const before = w.availableBalance; w.availableBalance -= minor / 100; await w.save(); const withdrawal = await Withdrawal.create({ withdrawalNumber: number('WDR'), freelancer: user._id, amount: minor / 100, amountMinor: minor, currency: w.currency, method, destinationReference, idempotencyKey, status: 'pending' }); await Transaction.create({ transactionNumber: number('TXN'), user: user._id, amount: minor / 100, amountMinor: minor, currency: w.currency, type: 'withdrawal', direction: 'debit', balanceBefore: before, balanceAfter: w.availableBalance, status: 'pending', description: 'Withdrawal balance reservation' }); return withdrawal; },
  async refunds(user) { return Refund.find({ client: user._id }).sort({ createdAt: -1 }); },
};

export function publicPayment(payment) {
  const p = payment.toObject ? payment.toObject() : { ...payment };
  for (const field of ['metadata', 'simulationOutcome', 'providerPaymentId', 'idempotencyKey', 'freelancerAmount', '__v']) delete p[field];
  return p;
}
export function emitPayment(io, p, event) {
  const data = { payment: publicPayment(p) };
  for (const recipient of [p.client, p.freelancer]) io?.to(`user:${recipient}`).emit(event, data);
}
export function startPaymentWorker(io) {
  let busy = false;
  const tick = async () => { if (busy) return; busy = true; try { await paymentService.processPending(io); } catch (error) { logger.error({ code: error.code }, 'Payment worker could not settle pending payments; will retry'); } finally { busy = false; } };
  const timer = setInterval(tick, 1000); timer.unref(); void tick();
  return () => clearInterval(timer);
}

async function queueLegacyPayment(payment, session) {
  payment.provider = Object.values(SIMULATED_PROVIDER).includes(payment.provider) ? payment.provider : 'BKASH_SIMULATED';
  payment.paymentMethod = payment.provider;
  payment.transactionReference ||= ref(); payment.idempotencyKey ||= `legacy-${payment._id}`;
  payment.processAfter = new Date(Date.now() + 1200); payment.simulationOutcome = 'success';
  const old = await PaymentTransaction.findOne({ idempotencyKey: payment.idempotencyKey }).session(session);
  if (!old) await PaymentTransaction.create([{ transactionNumber: payment.transactionReference, transactionReference: payment.transactionReference, user: payment.client, clientId: payment.client, developerId: payment.freelancer, projectId: payment.project, contractId: payment.contract, milestoneId: payment.milestone, amount: payment.amount, amountMinor: payment.amountMinor, currency: payment.currency, provider: payment.provider, paymentMethod: payment.provider, type: 'client_payment', status: 'pending', idempotencyKey: payment.idempotencyKey, metadata: { payment: payment._id } }], { session });
  await payment.save({ session });
}
