import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ review: { type: Schema.Types.ObjectId, ref: 'Review', required: true, index: true }, reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true }, reason: { type: String, required: true }, description: { type: String, maxlength: 2000, default: '' }, status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', index: true }, resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' }, resolution: String, resolvedAt: Date }, { timestamps: true });
schema.index({ review: 1, reporter: 1 }, { unique: true });
export const ReviewReport = mongoose.model('ReviewReport', schema);
