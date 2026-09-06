import mongoose from 'mongoose';

const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    email: {
      newMessages: { type: Boolean, default: true },
      jobInvitations: { type: Boolean, default: true },
      proposalUpdates: { type: Boolean, default: true },
      contractUpdates: { type: Boolean, default: true },
    },
    inApp: {
      newMessages: { type: Boolean, default: true },
      proposal: { type: Boolean, default: true },
      hiring: { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const NotificationPreference = mongoose.model('NotificationPreference', notificationPreferenceSchema);
