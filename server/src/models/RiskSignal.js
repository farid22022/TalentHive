import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ signalType: { type: String, required: true, index: true }, severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true }, weight: { type: Number, min: 0, max: 100, required: true }, source: { type: String, required: true }, confidence: { type: Number, min: 0, max: 1, default: 0.5 }, subjectType: String, subjectId: { type: Schema.Types.ObjectId, index: true }, metadata: { type: Schema.Types.Mixed, default: {} }, expiresAt: Date }, { timestamps: true });
export const RiskSignal = mongoose.model('RiskSignal', schema);
