import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true }, client: { type: Schema.Types.ObjectId, ref: 'User', required: true }, freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true }, periodStart: { type: Date, required: true }, periodEnd: { type: Date, required: true }, totalMinutes: { type: Number, default: 0 }, billableMinutes: { type: Number, default: 0 }, subtotal: { type: Number, default: 0 }, status: { type: String, enum: ['open', 'locked', 'in_review', 'approved', 'disputed', 'paid'], default: 'open', index: true }, lockedAt: Date, submittedAt: Date, approvedAt: Date, idempotencyKey: String }, { timestamps: true });
schema.index({ contract: 1, periodStart: 1 }, { unique: true });
export const BillingPeriod = mongoose.model('BillingPeriod', schema);
