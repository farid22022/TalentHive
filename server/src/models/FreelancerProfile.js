import mongoose from 'mongoose';
import { AVAILABILITY, LANGUAGE_PROFICIENCY, VERIFICATION_STATE } from '../config/constants.js';

const { Schema } = mongoose;

const educationSchema = new Schema(
  {
    school: { type: String, required: true, trim: true, maxlength: 150 },
    degree: { type: String, trim: true, maxlength: 150, default: '' },
    field: { type: String, trim: true, maxlength: 150, default: '' },
    startYear: { type: Number, min: 1950, max: 2100 },
    endYear: { type: Number, min: 1950, max: 2100 },
  },
  { _id: true }
);

const experienceSchema = new Schema(
  {
    company: { type: String, required: true, trim: true, maxlength: 150 },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    location: { type: String, trim: true, maxlength: 150, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
    current: { type: Boolean, default: false },
    description: { type: String, trim: true, maxlength: 3000, default: '' },
  },
  { _id: true }
);

const certificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    issuer: { type: String, trim: true, maxlength: 150, default: '' },
    year: { type: Number, min: 1950, max: 2100 },
    url: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: true }
);

const portfolioSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    url: { type: String, trim: true, maxlength: 500, default: '' },
    image: { type: String, trim: true, maxlength: 500, default: '' },
    tags: { type: [String], default: [] },
  },
  { _id: true }
);

const languageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    proficiency: {
      type: String,
      enum: Object.values(LANGUAGE_PROFICIENCY),
      default: LANGUAGE_PROFICIENCY.CONVERSATIONAL,
    },
  },
  { _id: false }
);

const freelancerProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    title: { type: String, trim: true, maxlength: 120, default: '' }, // professional headline
    overview: { type: String, trim: true, maxlength: 5000, default: '' },
    category: { type: String, trim: true, maxlength: 80, default: '' },
    hourlyRate: { type: Number, min: 0, max: 100000, default: 0 },
    availability: {
      type: String,
      enum: Object.values(AVAILABILITY),
      default: AVAILABILITY.NOT_AVAILABLE,
    },
    skills: { type: [String], default: [], index: true },
    languages: { type: [languageSchema], default: [] },
    location: {
      country: { type: String, trim: true, maxlength: 80, default: '' },
      city: { type: String, trim: true, maxlength: 80, default: '' },
      timezone: { type: String, trim: true, maxlength: 60, default: '' },
    },
    links: {
      website: { type: String, trim: true, maxlength: 300, default: '' },
      linkedin: { type: String, trim: true, maxlength: 300, default: '' },
      github: { type: String, trim: true, maxlength: 300, default: '' },
    },
    education: { type: [educationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    portfolio: { type: [portfolioSchema], default: [] },
    cv: {
      url: { type: String, default: '' },
      filename: { type: String, default: '' },
      provider: { type: String, default: '' },
      path: { type: String, default: '' }, // local abs path (private docs); never serialized raw
      uploadedAt: { type: Date },
    },
    completeness: { type: Number, min: 0, max: 100, default: 0 },
    onboardingCompleted: { type: Boolean, default: false },
    visibility: { type: String, enum: ['public', 'private'], default: 'private' },
    // Verification badge state lives here in Phase 2; the pipeline (Phase 4) drives transitions.
    verificationState: {
      type: String,
      enum: Object.values(VERIFICATION_STATE),
      default: VERIFICATION_STATE.UNVERIFIED,
    },
    // Denormalized trust badges (email/phone/identity/document/verified) for public display.
    // Recomputed by the verification pipeline (Phase 4); never set from AI signals.
    badges: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Text index for basic talent search (title/overview/skills). Real search tuned in Phase 5/12.
freelancerProfileSchema.index({ title: 'text', overview: 'text', skills: 'text' });

/** Weighted profile-completeness score (0–100). Recomputed on every save. */
freelancerProfileSchema.methods.computeCompleteness = function computeCompleteness() {
  const checks = [
    [!!this.title, 12],
    [(this.overview || '').length >= 50, 15],
    [!!this.category, 8],
    [this.hourlyRate > 0, 8],
    [this.availability && this.availability !== AVAILABILITY.NOT_AVAILABLE, 5],
    [(this.skills || []).length >= 3, 15],
    [(this.languages || []).length >= 1, 5],
    [!!this.location?.country, 5],
    [(this.education || []).length >= 1, 7],
    [(this.experience || []).length >= 1, 10],
    [(this.portfolio || []).length >= 1, 5],
    [!!this.cv?.url, 5],
  ];
  const score = checks.reduce((sum, [passed, weight]) => sum + (passed ? weight : 0), 0);
  return Math.min(100, score);
};

freelancerProfileSchema.pre('save', function recompute(next) {
  this.completeness = this.computeCompleteness();
  next();
});

// Strip the private local CV path from any client-facing serialization.
freelancerProfileSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    if (ret.cv) delete ret.cv.path;
    delete ret.__v;
    return ret;
  },
});

export const FreelancerProfile = mongoose.model('FreelancerProfile', freelancerProfileSchema);
