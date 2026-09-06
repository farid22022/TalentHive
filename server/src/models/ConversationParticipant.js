import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true }, user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' }, joinedAt: { type: Date, default: Date.now }, lastReadMessage: { type: Schema.Types.ObjectId, ref: 'Message' }, lastReadAt: Date, isMuted: Boolean, isArchived: Boolean, canSendMessages: { type: Boolean, default: true }, canUploadFiles: { type: Boolean, default: true } }, { timestamps: true });
schema.index({ conversation: 1, user: 1 }, { unique: true });
export const ConversationParticipant = mongoose.model('ConversationParticipant', schema);
