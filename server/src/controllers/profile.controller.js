import { profileService } from '../services/profile.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, paginated } from '../utils/ApiResponse.js';
import { parsePagination } from '../utils/pagination.js';
import { ApiError } from '../utils/ApiError.js';
import fs from 'node:fs';

export const profileController = {
  getMine: asyncHandler(async (req, res) => {
    const profile = await profileService.getMine(req.user);
    return ok(res, { profile: profile.toJSON() }, 'OK');
  }),

  updateMine: asyncHandler(async (req, res) => {
    const profile = await profileService.updateMine(req.user, req.body);
    return ok(res, { profile: profile.toJSON() }, 'Profile updated');
  }),

  completeOnboarding: asyncHandler(async (req, res) => {
    const profile = await profileService.completeOnboarding(req.user, req.body);
    return ok(res, { profile: profile.toJSON() }, 'Onboarding complete');
  }),

  uploadAvatar: asyncHandler(async (req, res) => {
    const out = await profileService.uploadAvatar(req.user, req.file);
    return ok(res, out, 'Avatar updated');
  }),

  uploadCV: asyncHandler(async (req, res) => {
    const profile = await profileService.uploadCV(req.user, req.file);
    return ok(res, { profile: profile.toJSON() }, 'CV uploaded');
  }),

  removeCV: asyncHandler(async (req, res) => {
    const profile = await profileService.removeCV(req.user);
    return ok(res, { profile: profile.toJSON() }, 'CV removed');
  }),

  getPublic: asyncHandler(async (req, res) => {
    const profile = await profileService.getPublic(req.params.userId);
    return ok(res, { profile: profile.toJSON() }, 'OK');
  }),

  listTalent: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || {};
    const { page, limit, skip } = parsePagination(q, { defaultLimit: 12, maxLimit: 50 });
    const { items, total } = await profileService.listPublic({ ...q, page, limit, skip });
    return paginated(res, items.map((p) => p.toJSON()), { page, limit, total }, 'OK');
  }),

  // Serve a locally-stored file. Images are public; documents require auth (private CVs).
  serveFile: asyncHandler(async (req, res) => {
    const { kind, name } = req.params;
    if (kind === 'documents' && !req.user) throw ApiError.unauthorized('Authentication required');
    const abs = await profileService.resolveOwnedDocument(kind, name);
    if (!abs || !fs.existsSync(abs)) throw ApiError.notFound('File not found');
    return res.sendFile(abs);
  }),
};
