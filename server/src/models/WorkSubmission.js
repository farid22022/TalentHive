import mongoose from 'mongoose';
import { SUBMISSION_STATUS, PHASE8_LIMITS } from '../config/constants.js';
const { Schema } = mongoose;
const attachment = new Schema({ name: String, url: String, publicId: String, mimeType: String, size: Number }, { _id: false });
const schema = new Schema({ milestone: { type: Schema.Types.ObjectId, ref: 'Milestone', required: true, index: true }, project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true }, contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true }, submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, description: { type: String, required: true, trim: true, maxlength: PHASE8_LIMITS.DESCRIPTION_MAX }, links: { type: [String], default: [] }, attachments: { type: [attachment], default: [] }, version: { type: Number, required: true }, status: { type: String, enum: Object.values(SUBMISSION_STATUS), default: SUBMISSION_STATUS.SUBMITTED, index: true }, feedback: { type: String, maxlength: PHASE8_LIMITS.FEEDBACK_MAX, default: '' }, submittedAt: { type: Date, default: Date.now }, reviewedAt: Date }, { timestamps: true });
schema.index({ milestone: 1, version: 1 }, { unique: true });
schema.index({ project: 1, createdAt: -1 });
export const WorkSubmission = mongoose.model('WorkSubmission', schema);
