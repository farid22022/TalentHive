import mongoose from 'mongoose';
import { VERIFICATION_TYPE, VERIFICATION_REQUEST_STATUS } from '../config/constants.js';

const { Schema } = mongoose;

// A stored document backing an identity/document verification request.
// `path` is the private local abs path (never serialized to clients).
const docSchema = new Schema(
  {
    url: { type: String, default: '' },
    filename: { type: String, default: '' },
    provider: { type: String, default: '' },
    path: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const verificationRequestSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Admin-reviewed types only live here (identity/document). Email/phone are self-serve.
    type: {
      type: String,
      enum: [VERIFICATION_TYPE.IDENTITY, VERIFICATION_TYPE.DOCUMENT],
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(VERIFICATION_REQUEST_STATUS),
      default: VERIFICATION_REQUEST_STATUS.PENDING,
      index: true,
    },
    note: { type: String, trim: true, maxlength: 1000, default: '' }, // applicant's note
    documents: { type: [docSchema], default: [] },
    reviewNote: { type: String, trim: true, maxlength: 1000, default: '' }, // admin decision note
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

// Only one open (pending) request per user+type at a time (enforced in the service).
verificationRequestSchema.index({ user: 1, type: 1, status: 1 });
verificationRequestSchema.index({ status: 1, createdAt: -1 }); // admin queue

// Strip private local paths from any client/admin-facing serialization.
verificationRequestSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    if (Array.isArray(ret.documents)) ret.documents.forEach((d) => d && delete d.path);
    delete ret.__v;
    return ret;
  },
});

export const VerificationRequest = mongoose.model('VerificationRequest', verificationRequestSchema);
