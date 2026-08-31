import { verificationService } from '../services/verification.service.js';
import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created, paginated } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';

export const verificationController = {
  // --- Owner ---
  status: asyncHandler(async (req, res) => {
    const data = await verificationService.getStatus(req.user);
    return ok(res, data, 'OK');
  }),

  resendEmail: asyncHandler(async (req, res) => {
    const out = await authService.resendEmailVerification(req.user._id);
    return ok(res, out, 'Verification email sent');
  }),

  sendPhone: asyncHandler(async (req, res) => {
    const out = await verificationService.sendPhoneCode(req.user, req.body);
    return ok(res, out, 'Verification code sent');
  }),

  verifyPhone: asyncHandler(async (req, res) => {
    const out = await verificationService.verifyPhoneCode(req.user, req.body);
    return ok(res, out, 'Phone verified');
  }),

  submitRequest: asyncHandler(async (req, res) => {
    const reqDoc = await verificationService.submitRequest(req.user, req.body, req.files || []);
    return created(res, { request: reqDoc.toJSON() }, 'Verification request submitted');
  }),

  myRequests: asyncHandler(async (req, res) => {
    const items = await verificationService.myRequests(req.user);
    return ok(res, { requests: items.map((r) => r.toJSON()) }, 'OK');
  }),

  cancelRequest: asyncHandler(async (req, res) => {
    const reqDoc = await verificationService.cancelRequest(req.user, req.params.id);
    return ok(res, { request: reqDoc.toJSON() }, 'Request cancelled');
  }),

  // --- Admin ---
  adminQueue: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || {};
    const { page, limit, skip } = parsePagination(q, { defaultLimit: 20, maxLimit: 50 });
    const { items, total } = await verificationService.listQueue({ ...q, page, limit, skip });
    return paginated(res, items.map((r) => r.toJSON()), { page, limit, total }, 'OK');
  }),

  adminGetRequest: asyncHandler(async (req, res) => {
    const reqDoc = await verificationService.getRequestForAdmin(req.params.id);
    return ok(res, { request: reqDoc.toJSON() }, 'OK');
  }),

  adminDecide: asyncHandler(async (req, res) => {
    const reqDoc = await verificationService.decide(req.user, req.params.id, req.body);
    return ok(res, { request: reqDoc.toJSON() }, 'Decision recorded');
  }),
};
