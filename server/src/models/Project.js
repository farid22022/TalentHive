import mongoose from 'mongoose';
import { PROJECT_STATUS, PHASE8_LIMITS } from '../config/constants.js';
const { Schema } = mongoose;
const schema = new Schema({ client: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, job: { type: Schema.Types.ObjectId, ref: 'Job', required: true }, contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, unique: true }, title: { type: String, required: true, maxlength: PHASE8_LIMITS.TITLE_MAX }, description: { type: String, required: true, maxlength: PHASE8_LIMITS.DESCRIPTION_MAX }, status: { type: String, enum: Object.values(PROJECT_STATUS), default: PROJECT_STATUS.NOT_STARTED, index: true }, progress: { type: Number, min: 0, max: 100, default: 0 }, startDate: Date, dueDate: Date, completedAt: Date }, { timestamps: true });
schema.index({ client: 1, status: 1 });
schema.index({ freelancer: 1, status: 1 });
schema.set('toJSON', { virtuals: true, transform: (_d, r) => { delete r.__v; return r; } });
export const Project = mongoose.model('Project', schema);
