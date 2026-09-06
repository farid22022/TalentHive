import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { paymentService } from '../services/payment.service.js';
import { ApiError } from '../utils/ApiError.js';
import { notificationService } from '../services/notification.service.js';
import { PAYMENT_STATUS } from '../config/constants.js';
export const paymentController = {
  fund: asyncHandler(async (req, res) => created(res, { payment: await paymentService.fundMilestone(req.user, req.params.milestoneId, req.get('Idempotency-Key')) }, 'Payment checkout created')),
  simulate: asyncHandler(async (req, res) => {
    const payment = await paymentService.simulateFundMilestone(req.user, req.body.milestoneId, req.body.outcome, req.get('Idempotency-Key'), req.body.provider);
    if (payment.status === PAYMENT_STATUS.SUCCEEDED) {
      const io = req.app.get('io');
      io?.to(`user:${payment.client}`).emit('payment:success', { payment });
      io?.to(`user:${payment.freelancer}`).emit('payment:processing', { payment: { id: payment._id, amount: payment.amount, currency: payment.currency, escrowStatus: payment.escrowStatus } });
      await notificationService.publish({ recipient: payment.client, type: 'PAYMENT_SUCCESS', title: 'Payment successful', body: `Your payment of ${payment.amount} ${payment.currency} is held in escrow.`, entityType: 'Payment', entityId: payment._id });
      await notificationService.publish({ recipient: payment.freelancer, type: 'PAYMENT_RECEIVED', title: 'Payment received', body: `A client funded ${payment.amount} ${payment.currency} for your milestone. It is held in escrow.`, entityType: 'Payment', entityId: payment._id });
    }
    return created(res, { payment }, 'Simulated payment processed');
  }),
  list: asyncHandler(async (req, res) => ok(res, { payments: await paymentService.list(req.user) })),
  get: asyncHandler(async (req, res) => ok(res, { payment: await paymentService.getOne(req.user, req.params.id) })),
  webhook: asyncHandler(async (req, res) => { if (!paymentService.verifyWebhookSignature(req.body, req.get('X-Payment-Signature'))) throw ApiError.unauthorized('Invalid payment webhook signature'); return ok(res, { event: await paymentService.webhook(req.get('X-Payment-Provider') || 'mock', req.body) }, 'Webhook processed'); }),
  release: asyncHandler(async (req, res) => ok(res, { transaction: await paymentService.release(req.user, req.params.milestoneId) }, 'Funds released')),
  wallet: asyncHandler(async (req, res) => ok(res, { wallet: await paymentService.getWallet(req.user) })),
  transactions: asyncHandler(async (req, res) => ok(res, { transactions: await paymentService.transactions(req.user) })),
  withdraw: asyncHandler(async (req, res) => created(res, { withdrawal: await paymentService.withdraw(req.user, req.body, req.get('Idempotency-Key')) }, 'Withdrawal requested')),
};
