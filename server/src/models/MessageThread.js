import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ rootMessage: { type: Schema.Types.ObjectId, ref: 'Message', required: true, unique: true }, conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true }, createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, replyCount: { type: Number, default: 0 }, lastReplyAt: Date }, { timestamps: true });
export const MessageThread = mongoose.model('MessageThread', schema);
