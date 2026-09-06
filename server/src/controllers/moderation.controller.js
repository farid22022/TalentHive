import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { moderationService as s } from '../services/moderation.service.js';
export const moderationController = { report: asyncHandler(async (q, r) => created(r, { report: await s.createReport(q.user, q.body) }, 'Report submitted')), queue: asyncHandler(async (q, r) => ok(r, { reports: await s.queue(q.user, q.query) })), action: asyncHandler(async (q, r) => ok(r, { action: await s.action(q.user, q.params.id, q.body) }, 'Moderation action recorded')) };
