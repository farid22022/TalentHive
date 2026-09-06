import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import { notificationService as s } from '../services/notification.service.js';
export const notificationController = { list: asyncHandler(async (q, r) => ok(r, await s.list(q.user, q.query))), read: asyncHandler(async (q, r) => ok(r, { notification: await s.markRead(q.user, q.params.id) })), readAll: asyncHandler(async (q, r) => ok(r, await s.markAllRead(q.user))), archive: asyncHandler(async (q, r) => ok(r, { notification: await s.archive(q.user, q.params.id) })), preferences: asyncHandler(async (q, r) => ok(r, { preferences: await s.preferences(q.user) })), updatePreferences: asyncHandler(async (q, r) => ok(r, { preferences: await s.updatePreferences(q.user, q.body) })) };
