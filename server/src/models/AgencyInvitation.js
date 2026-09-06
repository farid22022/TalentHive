import mongoose from 'mongoose';
import { AGENCY_ROLES } from '../config/constants.js';
const { Schema } = mongoose;
const schema = new Schema({ agency: { type: Schema.Types.ObjectId, ref: 'Agency', required: true, index: true }, email: { type: String, lowercase: true, trim: true, index: true }, invitee: { type: Schema.Types.ObjectId, ref: 'User', index: true }, role: { type: String, enum: Object.values(AGENCY_ROLES), default: AGENCY_ROLES.MEMBER }, invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, tokenHash: { type: String, required: true, unique: true }, expiresAt: { type: Date, required: true, index: true }, status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired', 'cancelled'], default: 'pending', index: true } }, { timestamps: true });
export const AgencyInvitation = mongoose.model('AgencyInvitation', schema);
