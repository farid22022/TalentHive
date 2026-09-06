import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ assessmentId: { type: String, unique: true, index: true }, subjectType: { type: String, required: true }, subjectId: { type: Schema.Types.ObjectId, required: true, index: true }, score: { type: Number, min: 0, max: 100, required: true }, level: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true }, signals: [{ type: String }], decision: { type: String, enum: ['allow', 'challenge', 'limit', 'review_required', 'block'], required: true }, policyVersion: { type: String, default: 'v1' }, confidence: { type: Number, min: 0, max: 1, default: 0.5 }, explanations: [String], expiresAt: Date }, { timestamps: true });
export const RiskAssessment = mongoose.model('RiskAssessment', schema);
