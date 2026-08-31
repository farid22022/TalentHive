import mongoose from 'mongoose';
import { AI_FEATURES } from '../config/constants.js';

const { Schema } = mongoose;

/** Lightweight per-call usage/cost log for AI features (analytics + budgeting). */
const aiUsageSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    feature: { type: String, enum: Object.values(AI_FEATURES), required: true },
    provider: { type: String, default: '' },
    model: { type: String, default: '' },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    cached: { type: Boolean, default: false },
  },
  { timestamps: true }
);

aiUsageSchema.index({ user: 1, createdAt: -1 });

export const AIUsage = mongoose.model('AIUsage', aiUsageSchema);
