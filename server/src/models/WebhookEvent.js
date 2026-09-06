import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ eventId: { type: String, required: true }, provider: { type: String, required: true }, eventType: String, payloadHash: String, processed: { type: Boolean, default: false }, processedAt: Date, error: String, payload: Schema.Types.Mixed }, { timestamps: true });
schema.index({ provider: 1, eventId: 1 }, { unique: true });
export const WebhookEvent = mongoose.model('WebhookEvent', schema);
