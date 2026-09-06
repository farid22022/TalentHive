import { Message } from '../models/Message.js';
import { Conversation } from '../models/Conversation.js';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/index.js';

function ensureParticipant(conversation, userId) {
  if (!conversation.participants.some((p) => String(p) === String(userId))) {
    throw ApiError.forbidden('You are not a participant in this conversation.');
  }
}

export const messageService = {
  async list(conversationId, user, { limit = 30, before } = {}) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw ApiError.notFound('Conversation not found');
    ensureParticipant(conversation, user._id);
    const filter = { conversation: conversation._id };
    if (before) filter._id = { $lt: before };
    return Message.find(filter).sort({ createdAt: -1 }).limit(limit).populate('sender', 'name avatar role');
  },
  async create(user, conversationId, payload) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw ApiError.notFound('Conversation not found');
    ensureParticipant(conversation, user._id);
    if (conversation.status === 'blocked') throw ApiError.forbidden('This conversation is blocked');
    const text = (payload.text || '').trim();
    const attachments = payload.attachments || [];
    if (!text && !attachments.length) throw ApiError.badRequest('Message cannot be empty');
    if (text.length > (config.message?.maxTextLength || 4000)) throw ApiError.badRequest('Message too long');
    const message = await Message.create({
      conversation: conversation._id,
      sender: user._id,
      clientMessageId: payload.clientMessageId || '',
      text,
      type: attachments.length ? (attachments[0].mimeType?.startsWith('image/') ? 'image' : 'file') : 'text',
      attachments,
      replyTo: payload.replyTo || null,
    });
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();
    const recipients = conversation.participants.filter((p) => String(p) !== String(user._id));
    await Notification.insertMany(recipients.map((recipient) => ({
      recipient,
      sender: user._id,
      type: 'message',
      conversation: conversation._id,
      message: message._id,
      read: false,
    })));
    return message;
  },
  async markRead(user, conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) throw ApiError.notFound('Conversation not found');
    ensureParticipant(conversation, user._id);
    await Message.updateMany(
      { conversation: conversation._id, sender: { $ne: user._id }, readBy: { $not: { $elemMatch: { user: user._id } } } },
      { $push: { readBy: { user: user._id, readAt: new Date() } } }
    );
    conversation.unreadCounts.set(String(user._id), 0);
    await conversation.save();
    return { ok: true };
  },
  async edit(user, messageId, text) { const message = await Message.findOne({ _id: messageId, sender: user._id }); if (!message || message.deleted) throw ApiError.notFound('Message not found'); if (!text?.trim() || text.length > (config.message?.maxTextLength || 4000)) throw ApiError.badRequest('Invalid message text'); message.text = text.trim(); message.isEdited = true; message.edited = true; message.editedAt = new Date(); return message.save(); },
  async remove(user, messageId) { const message = await Message.findOne({ _id: messageId, sender: user._id }); if (!message) throw ApiError.notFound('Message not found'); message.deleted = true; message.deletedAt = new Date(); message.text = ''; message.attachments = []; return message.save(); },
  async react(user, messageId, emoji) { const message = await Message.findById(messageId); if (!message) throw ApiError.notFound('Message not found'); const conversation = await Conversation.findById(message.conversation); ensureParticipant(conversation, user._id); message.reactions = message.reactions.filter((r) => String(r.user) !== String(user._id)); if (emoji) message.reactions.push({ user: user._id, emoji, createdAt: new Date() }); return message.save(); },
  async pin(user, messageId) { const message = await Message.findById(messageId); if (!message) throw ApiError.notFound('Message not found'); const conversation = await Conversation.findById(message.conversation); ensureParticipant(conversation, user._id); message.pinnedAt = message.pinnedAt ? null : new Date(); message.pinnedBy = message.pinnedAt ? user._id : null; return message.save(); },
  async search(user, conversationId, text) { const conversation = await Conversation.findById(conversationId); if (!conversation) throw ApiError.notFound('Conversation not found'); ensureParticipant(conversation, user._id); return Message.find({ conversation: conversation._id, deleted: false, $text: { $search: text } }).sort({ createdAt: -1 }).limit(50); },
};
