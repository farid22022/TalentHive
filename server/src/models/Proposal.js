import mongoose from 'mongoose';
import { BUDGET_TYPE, PROPOSAL_STATUS, PROPOSAL_INVITATION_STATUS, PROPOSAL_LIMITS } from '../config/constants.js';

const { Schema } = mongoose;

const bidSchema = new Schema(
  {
    amount: { type: Number, min: 0, max: PROPOSAL_LIMITS.BID_MAX, default: 0 },
    type: { type: String, enum: Object.values(BUDGET_TYPE), default: BUDGET_TYPE.FIXED },
    currency: { type: String, trim: true, maxlength: 3, default: 'USD' },
  },
  { _id: false }
);

// Milestones keep their _id so Phase 8 contracts can reference them individually.
const milestoneSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: PROPOSAL_LIMITS.MILESTONE_TITLE_MAX },
  amount: { type: Number, min: 0, max: PROPOSAL_LIMITS.BID_MAX, default: 0 },
  dueDate: { type: Date },
  description: { type: String, trim: true, maxlength: PROPOSAL_LIMITS.MILESTONE_DESC_MAX, default: '' },
});

const proposalSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Denormalized job owner so a client can list every proposal they received in one query.
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coverLetter: { type: String, required: true, trim: true, maxlength: PROPOSAL_LIMITS.COVER_LETTER_MAX },
    bid: { type: bidSchema, default: () => ({}) },
    estimatedDays: { type: Number, min: 0, max: PROPOSAL_LIMITS.DAYS_MAX, default: 0 },
    milestones: { type: [milestoneSchema], default: [] },
    status: {
      type: String,
      enum: Object.values(PROPOSAL_STATUS),
      default: PROPOSAL_STATUS.SUBMITTED,
      index: true,
    },
    invitationStatus: { type: String, enum: Object.values(PROPOSAL_INVITATION_STATUS), default: PROPOSAL_INVITATION_STATUS.NONE, index: true },
    offer: { type: Schema.Types.ObjectId, ref: 'Offer', default: null, index: true },
    // Client review trail.
    reviewNote: { type: String, trim: true, maxlength: PROPOSAL_LIMITS.REVIEW_NOTE_MAX, default: '' },
    viewedAt: { type: Date, default: null }, // first time the client opened it
    decidedAt: { type: Date, default: null },
    withdrawnAt: { type: Date, default: null },
    // True when the cover letter started from an AI draft (transparency, not a quality signal).
    aiAssisted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One proposal per freelancer per job (withdrawn proposals are revived, not duplicated).
proposalSchema.index({ job: 1, freelancer: 1 }, { unique: true });
// Client review queue and freelancer history.
proposalSchema.index({ client: 1, status: 1, createdAt: -1 });
proposalSchema.index({ freelancer: 1, createdAt: -1 });
proposalSchema.index({ job: 1, status: 1, createdAt: -1 });

proposalSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Proposal = mongoose.model('Proposal', proposalSchema);
