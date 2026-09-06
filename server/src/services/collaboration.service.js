import { Conversation } from '../models/Conversation.js';
import { ConversationParticipant } from '../models/ConversationParticipant.js';
import { Message } from '../models/Message.js';
import { MessageThread } from '../models/MessageThread.js';
import { SavedMessage } from '../models/SavedMessage.js';
import { PinnedMessage } from '../models/PinnedMessage.js';
import { ApiError } from '../utils/ApiError.js';
const uid = (u) => u._id || u.id;
const member = async (user, conversationId) => { const c = await Conversation.findOne({ _id: conversationId, participants: uid(user) }); if (!c) throw ApiError.forbidden('You are not a conversation participant'); return c; };
export const collaborationService = {
  addParticipant: async (u, id, userId) => { const c = await member(u, id); const existing = await ConversationParticipant.findOne({ conversation: c._id, user: uid(u), role: { $in: ['owner', 'admin'] } }); if (!existing && String(c.participants[0]) !== String(uid(u))) throw ApiError.forbidden('Only conversation managers can add participants'); if (!c.participants.some((p) => String(p) === String(userId))) { c.participants.push(userId); await c.save(); } return ConversationParticipant.findOneAndUpdate({ conversation: c._id, user: userId }, { $setOnInsert: { conversation: c._id, user: userId } }, { upsert: true, new: true }); },
  thread: async (u, messageId) => { const root = await Message.findById(messageId); if (!root) throw ApiError.notFound('Message not found'); await member(u, root.conversation); return MessageThread.findOneAndUpdate({ rootMessage: root._id }, { $setOnInsert: { rootMessage: root._id, conversation: root.conversation, createdBy: uid(u) } }, { upsert: true, new: true }); },
  save: async (u, messageId) => { const m = await Message.findById(messageId); if (!m) throw ApiError.notFound('Message not found'); await member(u, m.conversation); return SavedMessage.findOneAndUpdate({ user: uid(u), message: m._id }, { user: uid(u), message: m._id }, { upsert: true, new: true }); },
  unsave: async (u, messageId) => SavedMessage.deleteOne({ user: uid(u), message: messageId }),
  saved: async (u) => SavedMessage.find({ user: uid(u) }).populate({ path: 'message', populate: { path: 'sender', select: 'name avatar' } }).sort({ createdAt: -1 }).limit(100),
  pinned: async (u, conversationId) => { await member(u, conversationId); return PinnedMessage.find({ conversation: conversationId }).populate('message').sort({ pinnedAt: -1 }); },
};
