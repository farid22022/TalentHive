import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ report: { type: Schema.Types.ObjectId, ref: 'Report', required: true, index: true }, admin: { type: Schema.Types.ObjectId, ref: 'User', required: true }, action: { type: String, enum: ['warn', 'hide_content', 'remove_content', 'restrict_account', 'suspend_account', 'ban_account', 'require_reverification', 'escalate', 'dismiss'], required: true }, reason: { type: String, required: true, maxlength: 2000 }, before: Schema.Types.Mixed, after: Schema.Types.Mixed }, { timestamps: true });
export const ModerationAction = mongoose.model('ModerationAction', schema);
