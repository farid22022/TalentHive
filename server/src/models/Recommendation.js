import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, type: { type: String, enum: ['job', 'freelancer', 'project', 'category'], required: true }, targetType: String, targetId: { type: Schema.Types.ObjectId, required: true }, score: { type: Number, min: 0, max: 100 }, confidence: { type: Number, min: 0, max: 1 }, reasons: { type: [String], default: [] }, source: { type: String, enum: ['search', 'ai_match', 'personalization', 'trending', 'similarity', 'hybrid'], default: 'hybrid' }, expiresAt: Date }, { timestamps: true });
schema.index({ user: 1, type: 1, score: -1, createdAt: -1 });
export const Recommendation = mongoose.model('Recommendation', schema);
