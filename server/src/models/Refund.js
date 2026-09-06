import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ refundNumber: { type: String, unique: true, index: true }, payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true }, client: { type: Schema.Types.ObjectId, ref: 'User', required: true }, freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true }, amount: { type: Number, min: 0, required: true }, currency: String, reason: { type: String, required: true }, providerRefundId: String, status: { type: String, enum: ['requested', 'processing', 'succeeded', 'failed', 'cancelled'], default: 'requested' }, idempotencyKey: { type: String, index: true }, completedAt: Date }, { timestamps: true });
export const Refund = mongoose.model('Refund', schema);
