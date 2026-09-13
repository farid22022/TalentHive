import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 5000, default: '' },
  status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'], default: 'TODO', index: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  startedAt: Date, submittedAt: Date, completedAt: Date,
  revisionReason: { type: String, maxlength: 2000, default: '' },
}, { timestamps: true });
schema.index({ project: 1, status: 1, updatedAt: -1 });
export const ProjectTask = mongoose.model('ProjectTask', schema);
