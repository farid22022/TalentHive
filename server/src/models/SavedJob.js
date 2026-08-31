import mongoose from 'mongoose';

const { Schema } = mongoose;

/** A user's saved/bookmarked job. One row per (user, job). */
const savedJobSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  },
  { timestamps: true }
);

savedJobSchema.index({ user: 1, job: 1 }, { unique: true });

savedJobSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export const SavedJob = mongoose.model('SavedJob', savedJobSchema);
