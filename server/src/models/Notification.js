import mongoose from 'mongoose';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    type: { type: String, required: true, index: true },
    category: { type: String, default: 'system', index: true },
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    entityType: { type: String, default: '' },
    entityId: { type: Schema.Types.ObjectId, default: null },
    actionUrl: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    channels: { type: [String], default: ['in_app', 'realtime'] },
    priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
    expiresAt: Date,
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', default: null, index: true },
    message: { type: Schema.Types.ObjectId, ref: 'Message', default: null, index: true },
    read: { type: Boolean, default: false, index: true },
    readAt: Date,
    archivedAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
export const Notification = mongoose.model('Notification', notificationSchema);
