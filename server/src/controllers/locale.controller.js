import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import { localeService as s } from '../services/locale.service.js';
export const localeController = { currencies: asyncHandler(async (_q, r) => ok(r, { currencies: await s.currencies() })), preferences: asyncHandler(async (q, r) => ok(r, { preferences: await s.preferences(q.user) })), update: asyncHandler(async (q, r) => ok(r, { preferences: await s.update(q.user, q.body) })) };
