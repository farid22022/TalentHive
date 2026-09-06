import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import { adminService as s } from '../services/admin.service.js';
export const adminController = { dashboard: asyncHandler(async (_q, r) => ok(r, await s.dashboard())), users: asyncHandler(async (q, r) => ok(r, { users: await s.users(q.query) })), setUserStatus: asyncHandler(async (q, r) => ok(r, { user: await s.setUserStatus(q.user, q.params.id, q.body.status, q.body.reason) })), audit: asyncHandler(async (_q, r) => ok(r, { logs: await s.audit() })) };
