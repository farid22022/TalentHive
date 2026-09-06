import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, query: { type: String, required: true, trim: true, maxlength: 120 }, type: { type: String, enum: ['jobs', 'freelancers', 'all'], default: 'all' }, filters: { type: Schema.Types.Mixed, default: {} } }, { timestamps: true });
schema.index({ user: 1, createdAt: -1 });
export const SearchHistory = mongoose.model('SearchHistory', schema);
