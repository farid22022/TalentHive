import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true }, project: { type: Schema.Types.ObjectId, ref: 'Project' }, startedAt: { type: Date, required: true }, lastHeartbeatAt: { type: Date, required: true }, pausedAt: Date, accumulatedMinutes: { type: Number, default: 0, min: 0 }, status: { type: String, enum: ['running', 'paused', 'stopped'], default: 'running', index: true }, deviceId: String, sessionId: { type: String, required: true, unique: true } }, { timestamps: true });
schema.index({ user: 1, status: 1 });
export const ActiveTimer = mongoose.model('ActiveTimer', schema);
