import mongoose from 'mongoose';

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }],
    type: {
      type: String,
      enum: ['general', 'direct', 'job', 'proposal', 'contract', 'project', 'milestone', 'agency', 'group', 'support', 'system'],
      default: 'general',
      index: true,
    },
    job: { type: Schema.Types.ObjectId, ref: 'Job', default: null, index: true },
    proposal: { type: Schema.Types.ObjectId, ref: 'Proposal', default: null, index: true },
    contract: { type: Schema.Types.ObjectId, ref: 'Contract', default: null, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    title: { type: String, default: '', maxlength: 200 },
    description: { type: String, default: '', maxlength: 1000 },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message', default: null },
    lastMessageAt: { type: Date, default: null, index: true },
    status: { type: String, enum: ['active', 'archived', 'closed', 'blocked'], default: 'active', index: true },
    unreadCounts: { type: Map, of: Number, default: {} },
    blockedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, type: 1, job: 1, proposal: 1, contract: 1, project: 1 }, { unique: true, sparse: true });
conversationSchema.index({ participants: 1, lastMessageAt: -1 });

conversationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Conversation = mongoose.model('Conversation', conversationSchema);
