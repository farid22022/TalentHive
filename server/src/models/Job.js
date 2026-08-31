import mongoose from 'mongoose';
import {
  JOB_STATUS,
  BUDGET_TYPE,
  EXPERIENCE_LEVEL,
  JOB_DURATION,
  CATEGORIES,
} from '../config/constants.js';

const { Schema } = mongoose;

const budgetSchema = new Schema(
  {
    type: { type: String, enum: Object.values(BUDGET_TYPE), default: BUDGET_TYPE.FIXED },
    min: { type: Number, min: 0, default: 0 },
    max: { type: Number, min: 0, default: 0 },
    currency: { type: String, trim: true, maxlength: 3, default: 'USD' },
  },
  { _id: false }
);

const jobSchema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    category: { type: String, trim: true, maxlength: 80, enum: CATEGORIES, index: true },
    skills: { type: [String], default: [], index: true },
    budget: { type: budgetSchema, default: () => ({}) },
    experienceLevel: {
      type: String,
      enum: Object.values(EXPERIENCE_LEVEL),
      default: EXPERIENCE_LEVEL.INTERMEDIATE,
    },
    duration: {
      type: String,
      enum: Object.values(JOB_DURATION),
      default: JOB_DURATION.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(JOB_STATUS),
      default: JOB_STATUS.OPEN,
      index: true,
    },
    // Denormalized counters for hot reads; recomputed by their owning phases.
    proposalsCount: { type: Number, min: 0, default: 0 }, // Phase 6
    savedCount: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

// Full-text search over title/description; skills/category use their own indexes.
jobSchema.index({ title: 'text', description: 'text' });
// Common browse sort: newest open jobs first.
jobSchema.index({ status: 1, createdAt: -1 });

jobSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const Job = mongoose.model('Job', jobSchema);
