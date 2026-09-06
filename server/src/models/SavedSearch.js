import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true }, name: { type: String, required: true, trim: true, maxlength: 100 }, query: { type: String, trim: true, maxlength: 120, default: '' }, type: { type: String, enum: ['jobs', 'freelancers'], required: true }, filters: { type: Schema.Types.Mixed, default: {} }, notificationEnabled: { type: Boolean, default: false }, frequency: { type: String, enum: ['instant', 'daily', 'weekly', 'disabled'], default: 'disabled' } }, { timestamps: true });
schema.index({ user: 1, name: 1 }, { unique: true });
export const SavedSearch = mongoose.model('SavedSearch', schema);
