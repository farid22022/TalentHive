import mongoose from 'mongoose';
import { MILESTONE_STATUS, PHASE8_LIMITS } from '../config/constants.js';
const { Schema } = mongoose;
const schema = new Schema({ project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true }, contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true }, title: { type: String, required: true, maxlength: PHASE8_LIMITS.TITLE_MAX }, description: { type: String, maxlength: PHASE8_LIMITS.DESCRIPTION_MAX, default: '' }, amount: { type: Number, min: 0, default: 0 }, dueDate: Date, order: { type: Number, min: 0, required: true }, status: { type: String, enum: Object.values(MILESTONE_STATUS), default: MILESTONE_STATUS.PENDING, index: true }, startedAt: Date, submittedAt: Date, approvedAt: Date, paymentState: { type: String, enum: ['not_ready', 'funding_pending', 'funded', 'payment_pending', 'paid', 'refunded'], default: 'not_ready' } }, { timestamps: true });
schema.index({ project: 1, order: 1 }, { unique: true });
schema.index({ dueDate: 1, status: 1 });
export const Milestone = mongoose.model('Milestone', schema);
