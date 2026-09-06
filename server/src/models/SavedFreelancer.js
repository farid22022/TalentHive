import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, freelancer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, notes: { type: String, maxlength: 1000, default: '' }, tags: { type: [String], default: [] } }, { timestamps: true });
schema.index({ user: 1, freelancer: 1 }, { unique: true });
export const SavedFreelancer = mongoose.model('SavedFreelancer', schema);
