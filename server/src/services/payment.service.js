import crypto from 'node:crypto';
import { Payment } from '../models/Payment.js';
import { Transaction } from '../models/Transaction.js';
import { Wallet } from '../models/Wallet.js';
import { Withdrawal } from '../models/Withdrawal.js';
import { Refund } from '../models/Refund.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { Milestone } from '../models/Milestone.js';
import { Project } from '../models/Project.js';
import { Contract } from '../models/Contract.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/index.js';
import { getPaymentProvider } from '../integrations/payment/index.js';
import { PAYMENT_STATUS, ESCROW_STATUS, MILESTONE_STATUS, CONTRACT_STATUS } from '../config/constants.js';

const sid = (v) => String(v);
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
  async fundMilestone(user, milestoneId, idempotencyKey) {
    if (!idempotencyKey) throw ApiError.badRequest('Idempotency-Key is required');
    const prior = await Payment.findOne({ idempotencyKey }); if (prior) return prior;
    const m = await Milestone.findById(milestoneId).populate('project'); if (!m) throw ApiError.notFound('Milestone not found');
    const p = m.project; if (sid(p.client) !== sid(user._id)) throw ApiError.forbidden('Only the client can fund this milestone');
    const contract = await Contract.findById(m.contract); if (!contract || contract.status !== CONTRACT_STATUS.ACTIVE) throw ApiError.badRequest('Contract is not active');
    if (![MILESTONE_STATUS.PENDING, MILESTONE_STATUS.FUNDING_PENDING].includes(m.status) || !m.amount) throw ApiError.badRequest('Milestone is not eligible for funding');
    const grossMinor = cents(m.amount); const feeMinor = fee(m.amount); const provider = getPaymentProvider();
    const intent = await provider.createPaymentIntent({ amount: grossMinor, currency: config.payment.currency.toLowerCase(), metadata: { milestone: sid(m._id) } });
    const payment = await Payment.create({ paymentNumber: number('PAY'), client: p.client, freelancer: p.freelancer, job: contract.job, proposal: contract.proposal, offer: contract.offer, contract: contract._id, project: p._id, milestone: m._id, provider: provider.name, providerPaymentId: intent.id, amount: m.amount, amountMinor: grossMinor, currency: config.payment.currency, platformFee: feeMinor / 100, freelancerAmount: (grossMinor - feeMinor) / 100, status: PAYMENT_STATUS.CHECKOUT_CREATED, escrowStatus: ESCROW_STATUS.FUNDING_PENDING, idempotencyKey });
    m.paymentState = 'funding_pending'; await m.save(); return payment;
  },
  async list(user) { return Payment.find({ $or: [{ client: user._id }, { freelancer: user._id }] }).sort({ createdAt: -1 }); },
  getOne: accessPayment,
  async webhook(providerName, event) {
    const eventId = event.id || event.eventId; if (!eventId) throw ApiError.badRequest('Webhook event id is required');
    const existing = await WebhookEvent.findOne({ provider: providerName, eventId }); if (existing?.processed) return existing;
    const record = existing || await WebhookEvent.create({ provider: providerName, eventId, eventType: event.type, payloadHash: crypto.createHash('sha256').update(JSON.stringify(event)).digest('hex'), payload: event });
    const paymentId = event.data?.object?.id || event.providerPaymentId; const p = await Payment.findOne({ providerPaymentId: paymentId });
    if (!p) throw ApiError.notFound('Payment for webhook not found');
    if (event.type?.includes('succeeded')) { p.status = PAYMENT_STATUS.SUCCEEDED; p.escrowStatus = ESCROW_STATUS.FUNDED; p.paidAt = new Date(); await p.save(); await Milestone.updateOne({ _id: p.milestone }, { $set: { status: MILESTONE_STATUS.FUNDED, paymentState: 'funded' } }); }
    else if (event.type?.includes('failed')) { p.status = PAYMENT_STATUS.FAILED; p.failureReason = event.data?.object?.failure_message || 'Payment failed'; await p.save(); }
    record.processed = true; record.processedAt = new Date(); await record.save(); return record;
  },
  async release(user, milestoneId) {
    const m = await Milestone.findById(milestoneId).populate('project'); if (!m) throw ApiError.notFound('Milestone not found'); if (sid(m.project.client) !== sid(user._id)) throw ApiError.forbidden('Only the client can release funds');
    const p = await Payment.findOne({ milestone: m._id }); if (!p || p.status !== PAYMENT_STATUS.SUCCEEDED || p.escrowStatus !== ESCROW_STATUS.FUNDED) throw ApiError.badRequest('Payment is not eligible for release'); if (m.status !== MILESTONE_STATUS.APPROVED) throw ApiError.badRequest('Milestone must be approved first');
    const prior = await Transaction.findOne({ payment: p._id, type: 'escrow_release' }); if (prior) return prior;
    const w = await wallet(p.freelancer); const before = w.pendingBalance; w.pendingBalance += p.freelancerAmount; w.totalEarned += p.freelancerAmount; await w.save();
    const tx = await Transaction.create({ transactionNumber: number('TXN'), user: p.freelancer, payment: p._id, project: p.project, contract: p.contract, milestone: p.milestone, type: 'escrow_release', direction: 'credit', amount: p.freelancerAmount, amountMinor: cents(p.freelancerAmount), currency: p.currency, balanceBefore: before, balanceAfter: w.pendingBalance, description: 'Milestone earnings pending release' });
    p.escrowStatus = ESCROW_STATUS.RELEASED; await p.save(); m.paymentState = 'paid'; m.status = MILESTONE_STATUS.PAID; await m.save(); return tx;
  },
  async getWallet(user) { return wallet(user._id); },
  async transactions(user) { return Transaction.find({ user: user._id }).sort({ createdAt: -1 }); },
  async withdraw(user, { amount, method, destinationReference }, idempotencyKey) { if (!idempotencyKey) throw ApiError.badRequest('Idempotency-Key is required'); const old = await Withdrawal.findOne({ idempotencyKey }); if (old) return old; const w = await wallet(user._id); const minor = cents(amount); if (w.status !== 'active' || minor <= 0 || minor > cents(w.availableBalance)) throw ApiError.badRequest('Insufficient available balance'); const before = w.availableBalance; w.availableBalance -= minor / 100; await w.save(); const withdrawal = await Withdrawal.create({ withdrawalNumber: number('WDR'), freelancer: user._id, amount: minor / 100, amountMinor: minor, currency: w.currency, method, destinationReference, idempotencyKey, status: 'pending' }); await Transaction.create({ transactionNumber: number('TXN'), user: user._id, amount: minor / 100, amountMinor: minor, currency: w.currency, type: 'withdrawal', direction: 'debit', balanceBefore: before, balanceAfter: w.availableBalance, status: 'pending', description: 'Withdrawal balance reservation' }); return withdrawal; },
  async refunds(user) { return Refund.find({ client: user._id }).sort({ createdAt: -1 }); },
};
