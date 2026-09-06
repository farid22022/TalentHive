import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { virtualCardService } from '../services/virtualCard.service.js';
import { notificationService } from '../services/notification.service.js';

export const virtualCardController = {
  me: asyncHandler(async (req, res) => ok(res, { card: await virtualCardService.getMine(req.user) })),
  create: asyncHandler(async (req, res) => created(res, { card: await virtualCardService.getMine(req.user) }, 'Virtual card ready')),
  activate: asyncHandler(async (req, res) => ok(res, { card: await virtualCardService.activate(req.user) }, 'Card activated')),
  reload: asyncHandler(async (req, res) => {
    const result = await virtualCardService.reload(req.user, req.body, req.get('Idempotency-Key'));
    const io = req.app.get('io');
    io?.to(`user:${req.user._id}`).emit(result.payment.status === 'success' ? 'wallet:updated' : 'payment:failed', { card: result.card, payment: result.payment });
    await notificationService.publish({ recipient: req.user._id, type: result.payment.status === 'success' ? 'CARD_RELOAD_SUCCESS' : 'CARD_RELOAD_FAILED', title: result.payment.status === 'success' ? 'Card reload successful' : 'Card reload failed', body: result.payment.status === 'success' ? `Your simulated reload of ${result.payment.amount} ${result.payment.currency} completed.` : 'Your simulated reload failed. Your balance was not changed.', entityType: 'PaymentTransaction', entityId: result.payment._id, actionUrl: '/dashboard/card' });
    return created(res, result, 'Simulated reload processed');
  }),
  transactions: asyncHandler(async (req, res) => ok(res, { transactions: await virtualCardService.transactions(req.user) })),
  wallet: asyncHandler(async (req, res) => ok(res, { wallet: await virtualCardService.wallet(req.user) })),
  eligibility: asyncHandler(async (req, res) => ok(res, await virtualCardService.eligibility(req.user))),
  status: asyncHandler(async (req, res) => ok(res, { card: await virtualCardService.setStatus(req.user, req.body.action) }, 'Card status updated')),
  freeze: asyncHandler(async (req, res) => ok(res, { card: await virtualCardService.setStatus(req.user, 'freeze') }, 'Card frozen')),
  unfreeze: asyncHandler(async (req, res) => ok(res, { card: await virtualCardService.setStatus(req.user, 'unfreeze') }, 'Card unfrozen')),
};
