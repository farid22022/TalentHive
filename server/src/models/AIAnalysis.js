import mongoose from 'mongoose';
import { AI_FEATURES, ANALYSIS_STATUS } from '../config/constants.js';

const { Schema } = mongoose;

/**
 * Persisted result of an AI feature run (Phase 3: CV analysis).
 * `result` is provider-shaped structured output; kept as a flexible subdocument.
 */
const aiAnalysisSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    feature: { type: String, enum: Object.values(AI_FEATURES), required: true },
    provider: { type: String, default: '' },
    model: { type: String, default: '' },
    textHash: { type: String, required: true, index: true },
    source: {
      kind: { type: String, enum: ['cv_file', 'text'], default: 'text' },
      filename: { type: String, default: '' },
    },
    result: {
      summary: { type: String, default: '' },
      overallScore: { type: Number, min: 0, max: 100, default: 0 },
      atsScore: { type: Number, min: 0, max: 100, default: 0 },
      detectedSkills: { type: [String], default: [] },
      suggestedSkills: { type: [String], default: [] },
      experienceYears: { type: Number, min: 0, default: 0 },
      seniority: { type: String, default: '' },
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      recommendations: {
        type: [
          {
            _id: false,
            title: { type: String, default: '' },
            detail: { type: String, default: '' },
            priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
          },
        ],
        default: [],
      },
      missingSections: { type: [String], default: [] },
      wordCount: { type: Number, default: 0 },
      disclaimer: { type: String, default: '' },
    },
    tokens: {
      input: { type: Number, default: 0 },
      output: { type: Number, default: 0 },
    },
    estimatedCost: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(ANALYSIS_STATUS), default: ANALYSIS_STATUS.OK },
  },
  { timestamps: true }
);

// Cache lookup: latest analysis for a given user/feature/content.
aiAnalysisSchema.index({ user: 1, feature: 1, textHash: 1 });
// History listing ordered by recency.
aiAnalysisSchema.index({ user: 1, feature: 1, createdAt: -1 });

aiAnalysisSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);
