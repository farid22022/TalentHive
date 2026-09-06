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
const audit = (u, action, entityType, entityId, reason, before, after) => AdminAuditLog.create({ admin: u._id, action, entityType, entityId, reason, before, after });
export const adminService = {
  dashboard: async () => { const [totalUsers, activeUsers, jobs, contracts, projects, payments, disputes, reports, verification] = await Promise.all([User.countDocuments(), User.countDocuments({ status: 'active' }), Job.countDocuments(), Contract.countDocuments(), Project.countDocuments(), Payment.aggregate([{ $match: { status: 'succeeded' } }, { $group: { _id: null, amount: { $sum: '$amount' }, fees: { $sum: '$platformFee' } } }]), Dispute.countDocuments({ status: { $nin: ['closed', 'cancelled', 'resolved'] } }), ReviewReport.countDocuments({ status: { $in: ['open', 'pending'] } }), VerificationRequest.countDocuments({ status: 'pending' })]); return { marketplace: { totalUsers, activeUsers, jobs, contracts, projects }, finance: payments[0] || { amount: 0, fees: 0 }, trustSafety: { disputes, reports, verificationPending: verification } }; },
  users: async (query = {}) => User.find(query.q ? { $or: [{ name: new RegExp(query.q, 'i') }, { email: new RegExp(query.q, 'i') }] } : {}).select('name email role status createdAt lastActiveAt').sort({ createdAt: -1 }).limit(100),
  setUserStatus: async (u, userId, status, reason) => { if (!['active', 'suspended', 'banned'].includes(status) || !reason?.trim()) throw ApiError.badRequest('Valid status and reason are required'); const target = await User.findById(userId); if (!target) throw ApiError.notFound('User not found'); const before = { status: target.status }; target.status = status; await target.save(); await audit(u, `USER_${status.toUpperCase()}`, 'User', target._id, reason, before, { status }); return target; },
  audit: async () => AdminAuditLog.find().sort({ createdAt: -1 }).limit(100),
};
