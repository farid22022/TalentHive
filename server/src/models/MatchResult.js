import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true }, freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, proposal: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true, index: true }, matchScore: { type: Number, min: 0, max: 100, required: true }, confidence: { type: Number, min: 0, max: 1, required: true }, matchedSkills: { type: [String], default: [] }, missingSkills: { type: [String], default: [] }, experienceMatch: { type: Number, default: 0 }, projectMatch: { type: Number, default: 0 }, reputationSignals: { type: Schema.Types.Mixed, default: {} }, explanation: { type: Schema.Types.Mixed, default: {} }, model: { type: String, default: 'heuristic-v1' }, promptVersion: { type: String, default: 'match-v1' }, sourceHash: { type: String, index: true } }, { timestamps: true });
schema.index({ job: 1, matchScore: -1 });
schema.index({ job: 1, freelancer: 1, proposal: 1 }, { unique: true });
export const MatchResult = mongoose.model('MatchResult', schema);
