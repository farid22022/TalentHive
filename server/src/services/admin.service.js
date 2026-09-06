import { User } from '../models/User.js';
import { Job } from '../models/Job.js';
import { Contract } from '../models/Contract.js';
import { Project } from '../models/Project.js';
import { Payment } from '../models/Payment.js';
import { Dispute } from '../models/Dispute.js';
import { ReviewReport } from '../models/ReviewReport.js';
import { VerificationRequest } from '../models/VerificationRequest.js';
import { AdminAuditLog } from '../models/AdminAuditLog.js';
import { ApiError } from '../utils/ApiError.js';
import { VirtualCard } from '../models/VirtualCard.js';
import { WalletLedgerEntry } from '../models/WalletLedgerEntry.js';
import { VIRTUAL_CARD_STATUS, LEDGER_ENTRY_TYPE } from '../config/constants.js';
const audit = (u, action, entityType, entityId, reason, before, after) => AdminAuditLog.create({ admin: u._id, action, entityType, entityId, reason, before, after });
export const adminService = {
  dashboard: async () => { const [totalUsers, activeUsers, jobs, contracts, projects, payments, disputes, reports, verification] = await Promise.all([User.countDocuments(), User.countDocuments({ status: 'active' }), Job.countDocuments(), Contract.countDocuments(), Project.countDocuments(), Payment.aggregate([{ $match: { status: 'succeeded' } }, { $group: { _id: null, amount: { $sum: '$amount' }, fees: { $sum: '$platformFee' } } }]), Dispute.countDocuments({ status: { $nin: ['closed', 'cancelled', 'resolved'] } }), ReviewReport.countDocuments({ status: { $in: ['open', 'pending'] } }), VerificationRequest.countDocuments({ status: 'pending' })]); return { marketplace: { totalUsers, activeUsers, jobs, contracts, projects }, finance: payments[0] || { amount: 0, fees: 0 }, trustSafety: { disputes, reports, verificationPending: verification } }; },
  users: async (query = {}) => User.find(query.q ? { $or: [{ name: new RegExp(query.q, 'i') }, { email: new RegExp(query.q, 'i') }] } : {}).select('name email role status createdAt lastActiveAt').sort({ createdAt: -1 }).limit(100),
  setUserStatus: async (u, userId, status, reason) => { if (!['active', 'suspended', 'banned'].includes(status) || !reason?.trim()) throw ApiError.badRequest('Valid status and reason are required'); const target = await User.findById(userId); if (!target) throw ApiError.notFound('User not found'); const before = { status: target.status }; target.status = status; await target.save(); await audit(u, `USER_${status.toUpperCase()}`, 'User', target._id, reason, before, { status }); return target; },
  audit: async () => AdminAuditLog.find().sort({ createdAt: -1 }).limit(100),
  virtualCards: async () => VirtualCard.find().populate('user', 'name email role').sort({ createdAt: -1 }).limit(200),
  setVirtualCardStatus: async (admin, cardId, status, reason) => {
    if (!Object.values(VIRTUAL_CARD_STATUS).includes(status) || !reason?.trim()) throw ApiError.badRequest('Valid card status and reason are required');
    const card = await VirtualCard.findById(cardId); if (!card) throw ApiError.notFound('Virtual card not found');
    const before = { status: card.status }; card.status = status; await card.save(); await audit(admin, `CARD_${status.toUpperCase()}`, 'VirtualCard', card._id, reason, before, { status }); return card;
  },
  adjustVirtualCard: async (admin, cardId, amount, reason) => {
    if (!Number.isFinite(amount) || amount === 0 || !reason?.trim()) throw ApiError.badRequest('A non-zero amount and reason are required');
    const card = await VirtualCard.findById(cardId); if (!card) throw ApiError.notFound('Virtual card not found');
    const next = Math.round((card.balance + amount) * 100) / 100; if (next < 0) throw ApiError.badRequest('Adjustment cannot make the balance negative');
    card.balance = next; if (card.status === 'inactive' && next >= card.activationMinimum) { card.status = 'active'; card.activatedAt = card.activatedAt || new Date(); } await card.save();
    const entry = await WalletLedgerEntry.create({ entryNumber: `LED-${Date.now()}`, user: card.user, card: card._id, type: LEDGER_ENTRY_TYPE.ADJUSTMENT, direction: amount > 0 ? 'credit' : 'debit', amount: Math.abs(amount), currency: card.currency, referenceType: 'ADMIN_ADJUSTMENT', balanceAfter: next, description: reason, metadata: { admin: admin._id } });
    await audit(admin, 'ADMIN_BALANCE_ADJUSTMENT', 'VirtualCard', card._id, reason, { balance: next - amount }, { balance: next, ledgerEntry: entry._id }); return { card, entry };
  },
};
