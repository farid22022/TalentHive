import mongoose from 'mongoose';
const schema = new mongoose.Schema({ conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true }, message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true, unique: true }, pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, pinnedAt: { type: Date, default: Date.now } }, { timestamps: true });
export const PinnedMessage = mongoose.model('PinnedMessage', schema);
