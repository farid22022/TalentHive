import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ deviceId: { type: String, required: true, index: true }, user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, platform: String, browser: String, os: String, trusted: { type: Boolean, default: false }, status: { type: String, enum: ['unknown', 'trusted', 'challenged', 'blocked'], default: 'unknown' }, firstSeenAt: { type: Date, default: Date.now }, lastSeenAt: { type: Date, default: Date.now } }, { timestamps: true });
schema.index({ deviceId: 1, user: 1 }, { unique: true });
export const Device = mongoose.model('Device', schema);
