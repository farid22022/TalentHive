import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ eventId: { type: String, unique: true, index: true }, eventType: { type: String, required: true, index: true }, category: { type: String, required: true, index: true }, actorUser: { type: Schema.Types.ObjectId, ref: 'User', index: true }, targetType: String, targetId: Schema.Types.ObjectId, ipMetadata: { type: Schema.Types.Mixed, default: {} }, deviceId: String, sessionId: String, requestId: String, metadata: { type: Schema.Types.Mixed, default: {} }, riskScore: { type: Number, min: 0, max: 100, default: 0 }, riskLevel: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' } }, { timestamps: true });
export const SecurityEvent = mongoose.model('SecurityEvent', schema);
