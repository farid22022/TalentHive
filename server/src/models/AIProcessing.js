import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ entity: { type: String, required: true, index: true }, entityId: { type: Schema.Types.ObjectId, required: true, index: true }, operation: { type: String, required: true }, provider: String, model: String, status: { type: String, enum: ['queued', 'processing', 'completed', 'failed', 'retrying', 'cancelled'], default: 'queued', index: true }, startedAt: Date, completedAt: Date, error: String, tokens: { input: Number, output: Number } }, { timestamps: true });
schema.index({ entity: 1, entityId: 1, operation: 1, createdAt: -1 });
export const AIProcessing = mongoose.model('AIProcessing', schema);
