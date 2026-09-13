import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { paymentService, publicPayment, emitPayment } from '../services/payment.service.js';
import { ApiError } from '../utils/ApiError.js';
import { notificationService } from '../services/notification.service.js';
import { PAYMENT_STATUS } from '../config/constants.js';
export const paymentController = {
  fund: asyncHandler(async (req, res) => {
    const payment = await paymentService.fundMilestone(req.user, req.params.milestoneId, req.get('Idempotency-Key'), req.body.provider, req.body.outcome);
    emitPayment(req.app.get('io'), payment, 'payment:created');
    return res.status(202).json({ data: { payment: publicPayment(payment) }, message: 'Payment queued' });
  }),
  simulate: asyncHandler(async (req, res) => {
    const payment = await paymentService.simulateFundMilestone(req.user, req.body.milestoneId, req.body.outcome, req.get('Idempotency-Key'), req.body.provider);
    emitPayment(req.app.get('io'), payment, 'payment:created');
    return res.status(202).json({ data: { payment: publicPayment(payment) }, message: 'Payment queued' });
  }),
  list: asyncHandler(async (req, res) => ok(res, { payments: await paymentService.list(req.user) })),
  get: asyncHandler(async (req, res) => ok(res, { payment: await paymentService.getOne(req.user, req.params.id) })),
  webhook: asyncHandler(async (req, res) => { if (!paymentService.verifyWebhookSignature(req.body, req.get('X-Payment-Signature'))) throw ApiError.unauthorized('Invalid payment webhook signature'); return ok(res, { event: await paymentService.webhook(req.get('X-Payment-Provider') || 'mock', req.body) }, 'Webhook processed'); }),
  release: asyncHandler(async (req, res) => { const tx = await paymentService.release(req.user, req.params.milestoneId, req.app.get('io')); return ok(res, { transaction: { _id: tx._id, transactionNumber: tx.transactionNumber, status: tx.status } }, 'Funds released'); }),
  wallet: asyncHandler(async (req, res) => ok(res, { wallet: await paymentService.getWallet(req.user) })),
  transactions: asyncHandler(async (req, res) => ok(res, { transactions: await paymentService.transactions(req.user) })),
  withdraw: asyncHandler(async (req, res) => created(res, { withdrawal: await paymentService.withdraw(req.user, req.body, req.get('Idempotency-Key')) }, 'Withdrawal requested')),
};
