import mongoose from 'mongoose';
import { AGENCY_ROLES } from '../config/constants.js';
const { Schema } = mongoose;
const schema = new Schema({ agency: { type: Schema.Types.ObjectId, ref: 'Agency', required: true, index: true }, user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, role: { type: String, enum: Object.values(AGENCY_ROLES), default: AGENCY_ROLES.MEMBER }, status: { type: String, enum: ['invited', 'active', 'suspended', 'removed', 'left'], default: 'active', index: true }, invitedBy: { type: Schema.Types.ObjectId, ref: 'User' }, permissions: { type: [String], default: [] }, joinedAt: Date }, { timestamps: true });
schema.index({ agency: 1, user: 1 }, { unique: true });
export const AgencyMembership = mongoose.model('AgencyMembership', schema);
