import { Notification } from '../models/Notification.js';
import { NotificationPreference } from '../models/NotificationPreference.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
const uid = (u) => u._id || u.id;
export const notificationService = {
  list: async (user, query = {}) => { const limit = Math.min(Number(query.limit) || 30, 100); const filter = { recipient: uid(user), archivedAt: { $exists: false } }; if (query.unread === 'true') filter.read = false; const notifications = await Notification.find(filter).sort({ createdAt: -1 }).limit(limit).populate('actor', 'name avatar'); const unread = await Notification.countDocuments({ recipient: uid(user), read: false }); return { notifications, unread }; },
  markRead: async (user, notificationId) => { const n = await Notification.findOneAndUpdate({ _id: notificationId, recipient: uid(user) }, { read: true, readAt: new Date() }, { new: true }); if (!n) throw ApiError.notFound('Notification not found'); return n; },
  markAllRead: async (user) => { await Notification.updateMany({ recipient: uid(user), read: false }, { read: true, readAt: new Date() }); return { updated: true }; },
  archive: async (user, notificationId) => { const n = await Notification.findOneAndUpdate({ _id: notificationId, recipient: uid(user) }, { archivedAt: new Date() }, { new: true }); if (!n) throw ApiError.notFound('Notification not found'); return n; },
  preferences: async (user) => NotificationPreference.findOneAndUpdate({ user: uid(user) }, { $setOnInsert: { user: uid(user) } }, { upsert: true, new: true }),
  updatePreferences: async (user, body) => NotificationPreference.findOneAndUpdate({ user: uid(user) }, { $set: body }, { upsert: true, new: true, runValidators: true }),
  publish: async ({ recipient, actor = null, type, category = 'system', title, body, entityType = '', entityId = null, actionUrl = '', metadata = {}, priority = 'normal' }) => { const user = await User.findById(recipient).select('email name'); if (!user) return null; const n = await Notification.create({ recipient, actor, sender: actor, type, category, title, body, entityType, entityId, actionUrl, metadata, priority }); return n; },
};
