import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { paymentService } from '../services/payment.service.js';
import { ApiError } from '../utils/ApiError.js';
export const paymentController = {
  fund: asyncHandler(async (req, res) => created(res, { payment: await paymentService.fundMilestone(req.user, req.params.milestoneId, req.get('Idempotency-Key')) }, 'Payment checkout created')),
  list: asyncHandler(async (req, res) => ok(res, { payments: await paymentService.list(req.user) })),
  get: asyncHandler(async (req, res) => ok(res, { payment: await paymentService.getOne(req.user, req.params.id) })),
  webhook: asyncHandler(async (req, res) => { if (!paymentService.verifyWebhookSignature(req.body, req.get('X-Payment-Signature'))) throw ApiError.unauthorized('Invalid payment webhook signature'); return ok(res, { event: await paymentService.webhook(req.get('X-Payment-Provider') || 'mock', req.body) }, 'Webhook processed'); }),
  release: asyncHandler(async (req, res) => ok(res, { transaction: await paymentService.release(req.user, req.params.milestoneId) }, 'Funds released')),
  wallet: asyncHandler(async (req, res) => ok(res, { wallet: await paymentService.getWallet(req.user) })),
  transactions: asyncHandler(async (req, res) => ok(res, { transactions: await paymentService.transactions(req.user) })),
  withdraw: asyncHandler(async (req, res) => created(res, { withdrawal: await paymentService.withdraw(req.user, req.body, req.get('Idempotency-Key')) }, 'Withdrawal requested')),
};
