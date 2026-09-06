import mongoose from 'mongoose';

const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const readBySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    readAt: { type: Date, required: true },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientMessageId: { type: String, default: '', index: true },
    type: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text', index: true },
    text: { type: String, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    readBy: { type: [readBySchema], default: [] },
    edited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date, default: null },
    reactions: { type: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, emoji: String, createdAt: Date }], default: [] },
    pinnedAt: { type: Date, default: null },
    pinnedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, clientMessageId: 1 }, { unique: true, sparse: true });
messageSchema.index({ text: 'text', 'attachments.name': 'text' });

messageSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Message = mongoose.model('Message', messageSchema);
