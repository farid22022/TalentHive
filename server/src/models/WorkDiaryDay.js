import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true }, billingPeriod: { type: Schema.Types.ObjectId, ref: 'BillingPeriod' }, date: { type: Date, required: true }, timezone: { type: String, default: 'UTC' }, trackedMinutes: { type: Number, default: 0 }, manualMinutes: { type: Number, default: 0 }, billableMinutes: { type: Number, default: 0 }, activityScore: { type: Number, min: 0, max: 100 }, notes: { type: String, maxlength: 2000 }, screenshotCount: { type: Number, default: 0 }, status: { type: String, enum: ['open', 'locked'], default: 'open' } }, { timestamps: true });
schema.index({ user: 1, contract: 1, date: 1 }, { unique: true });
export const WorkDiaryDay = mongoose.model('WorkDiaryDay', schema);
