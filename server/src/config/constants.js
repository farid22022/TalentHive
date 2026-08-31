export const ROLES = Object.freeze({
  FREELANCER: 'freelancer',
  CLIENT: 'client',
  ADMIN: 'admin',
});

export const USER_STATUS = Object.freeze({
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
  DELETED: 'deleted',
});

export const VERIFICATION_STATE = Object.freeze({
  UNVERIFIED: 'UNVERIFIED',
  PROFILE_REVIEW: 'PROFILE_REVIEW',
  AI_REVIEWED: 'AI_REVIEWED',
  DOCUMENT_VERIFIED: 'DOCUMENT_VERIFIED',
  IDENTITY_VERIFIED: 'IDENTITY_VERIFIED',
  MANUALLY_VERIFIED: 'MANUALLY_VERIFIED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
});

// --- Freelancer profile domain (Phase 2) ---

export const AVAILABILITY = Object.freeze({
  FULL_TIME: 'full_time',
  PART_TIME: 'part_time',
  NOT_AVAILABLE: 'not_available',
});

export const LANGUAGE_PROFICIENCY = Object.freeze({
  BASIC: 'basic',
  CONVERSATIONAL: 'conversational',
  FLUENT: 'fluent',
  NATIVE: 'native',
});

// Top-level talent categories. Kept generic/original (not copied from any platform).
export const CATEGORIES = Object.freeze([
  'Development & IT',
  'Design & Creative',
  'Writing & Translation',
  'Sales & Marketing',
  'Admin & Support',
  'Finance & Accounting',
  'Engineering & Architecture',
  'Legal',
  'Data Science & Analytics',
  'Customer Service',
]);

// Field limits shared by validators + model to keep payloads bounded.
export const PROFILE_LIMITS = Object.freeze({
  SKILLS_MAX: 30,
  LANGUAGES_MAX: 15,
  EDUCATION_MAX: 20,
  EXPERIENCE_MAX: 30,
  CERTIFICATIONS_MAX: 30,
  PORTFOLIO_MAX: 30,
});

// --- AI domain (Phase 3) ---

export const AI_FEATURES = Object.freeze({
  CV_ANALYSIS: 'cv_analysis',
});

export const SENIORITY = Object.freeze({
  JUNIOR: 'junior',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead',
});

export const ANALYSIS_STATUS = Object.freeze({
  OK: 'ok',
  FAILED: 'failed',
});

export const AI_LIMITS = Object.freeze({
  CV_TEXT_MAX: 60000, // chars of CV text sent to the model
  HISTORY_MAX: 25, // persisted analyses kept per user/feature (oldest pruned)
});

// Rough per-1K-token USD pricing for cost logging. Unknown models => 0 (e.g. mock/local).
export const AI_PRICING = Object.freeze({
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4.1-mini': { input: 0.0004, output: 0.0016 },
});

// --- Verification domain (Phase 4) ---

// Email/phone are self-serve; identity/document need admin review.
export const VERIFICATION_TYPE = Object.freeze({
  EMAIL: 'email',
  PHONE: 'phone',
  IDENTITY: 'identity',
  DOCUMENT: 'document',
});

// Admin-reviewed request lifecycle.
export const VERIFICATION_REQUEST_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
});

// Denormalized trust badges surfaced on public profiles.
export const BADGES = Object.freeze({
  EMAIL: 'email_verified',
  PHONE: 'phone_verified',
  IDENTITY: 'identity_verified',
  DOCUMENT: 'document_verified',
  VERIFIED: 'verified',
});

export const VERIFICATION_LIMITS = Object.freeze({
  OTP_LENGTH: 6,
  OTP_TTL_MS: 10 * 60 * 1000, // phone code valid 10 min
  OTP_MAX_ATTEMPTS: 5, // wrong-code attempts before a new code is required
  DOCS_MAX: 3, // documents per identity/document request
  NOTE_MAX: 1000,
});

// --- Job marketplace domain (Phase 5) ---

// Job lifecycle. Only OPEN jobs are publicly browsable; DRAFT is owner-only.
export const JOB_STATUS = Object.freeze({
  DRAFT: 'draft',
  OPEN: 'open',
  CLOSED: 'closed',
  FILLED: 'filled',
});

// Fixed-price vs hourly engagements.
export const BUDGET_TYPE = Object.freeze({
  FIXED: 'fixed',
  HOURLY: 'hourly',
});

// Required freelancer experience for a job.
export const EXPERIENCE_LEVEL = Object.freeze({
  ENTRY: 'entry',
  INTERMEDIATE: 'intermediate',
  EXPERT: 'expert',
});

// Expected engagement length.
export const JOB_DURATION = Object.freeze({
  SHORT: 'short', // < 1 month
  MEDIUM: 'medium', // 1–3 months
  LONG: 'long', // 3+ months / ongoing
});

// Field limits shared by validators + model to keep payloads bounded.
export const JOB_LIMITS = Object.freeze({
  TITLE_MAX: 150,
  DESCRIPTION_MAX: 10000,
  SKILLS_MAX: 20,
  BUDGET_MAX: 10000000,
});
