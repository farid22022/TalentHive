import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ actor: { type: Schema.Types.ObjectId, ref: 'User', required: true }, action: { type: String, required: true, index: true }, resourceType: { type: String, required: true }, resourceId: { type: Schema.Types.ObjectId, required: true, index: true }, project: { type: Schema.Types.ObjectId, ref: 'Project', index: true }, metadata: { type: Schema.Types.Mixed, default: {} } }, { timestamps: true });
export const Activity = mongoose.model('Activity', schema);
