import mongoose from 'mongoose';
const { Schema } = mongoose;
const schema = new Schema({
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  task: { type: Schema.Types.ObjectId, ref: 'ProjectTask' },
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignee: { type: Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, trim: true, maxlength: 5000 },
  status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN', index: true },
  resolutionNote: { type: String, maxlength: 3000, default: '' },
  resolvedAt: Date, closedAt: Date,
}, { timestamps: true });
schema.index({ project: 1, status: 1, createdAt: -1 });
export const ProjectIssue = mongoose.model('ProjectIssue', schema);
