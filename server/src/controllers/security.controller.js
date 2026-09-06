import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { securityService as s } from '../services/security.service.js';
export const securityController = { device: asyncHandler(async (q, r) => ok(r, { device: await s.registerDevice(q.user, q.body) })), event: asyncHandler(async (q, r) => created(r, { event: await s.event({ ...q.body, actorUser: q.user._id }) }, 'Security event recorded')), assess: asyncHandler(async (q, r) => ok(r, { assessment: await s.assess(q.body) })), events: asyncHandler(async (q, r) => ok(r, { events: await s.events(q.query) })), assessments: asyncHandler(async (q, r) => ok(r, { assessments: await s.assessments(q.query) })) };
