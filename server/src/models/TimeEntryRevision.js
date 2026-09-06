import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({ timeEntry: { type: Schema.Types.ObjectId, ref: 'TimeEntry', required: true, index: true }, previousValues: { type: Schema.Types.Mixed, required: true }, newValues: { type: Schema.Types.Mixed, required: true }, changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, reason: { type: String, required: true, maxlength: 500 } }, { timestamps: true });
export const TimeEntryRevision = mongoose.model('TimeEntryRevision', schema);
