import mongoose from 'mongoose';
const schema = new mongoose.Schema({ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, message: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true, index: true } }, { timestamps: true });
schema.index({ user: 1, message: 1 }, { unique: true });
export const SavedMessage = mongoose.model('SavedMessage', schema);
