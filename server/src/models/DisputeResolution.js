import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ dispute: { type: Schema.Types.ObjectId, ref: 'Dispute', required: true, unique: true }, decision: { type: String, enum: ['release_all', 'release_partial', 'refund_all', 'refund_partial', 'no_refund', 'adjustment'], required: true }, decisionReason: { type: String, required: true, maxlength: 5000 }, resolvedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, refundAmount: { type: Number, min: 0, default: 0 }, releaseAmount: { type: Number, min: 0, default: 0 }, currency: String, financialActionId: String }, { timestamps: true });
export const DisputeResolution = mongoose.model('DisputeResolution', schema);
