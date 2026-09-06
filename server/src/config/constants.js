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
  PROPOSAL_DRAFT: 'proposal_draft', // Phase 6 — cover-letter assistant
  JOB_ANALYSIS: 'job_analysis',
  CANDIDATE_MATCH: 'candidate_match',
  PROPOSAL_ANALYSIS: 'proposal_analysis',
  PROFILE_ANALYSIS: 'profile_analysis',
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

// --- Proposals domain (Phase 6) ---

// Proposal lifecycle. `accepted` is written by hiring (Phase 8), never by a Phase 6 endpoint.
export const PROPOSAL_STATUS = Object.freeze({
  SUBMITTED: 'submitted',
  SHORTLISTED: 'shortlisted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
  ACCEPTED: 'accepted',
});
export const PROPOSAL_INVITATION_STATUS = Object.freeze({ NONE: 'none', SENT: 'sent', ACCEPTED: 'accepted', DECLINED: 'declined', CHANGES_REQUESTED: 'changes_requested' });

// Statuses that still count toward a job's proposalsCount and stay editable by their author.
export const ACTIVE_PROPOSAL_STATUSES = Object.freeze([
  PROPOSAL_STATUS.SUBMITTED,
  PROPOSAL_STATUS.SHORTLISTED,
]);

// Review actions a job owner may take in Phase 6 (hiring/accept lands in Phase 8).
export const PROPOSAL_DECISION = Object.freeze({
  SHORTLIST: 'shortlist',
  REJECT: 'reject',
  RECONSIDER: 'reconsider', // move a shortlisted/rejected proposal back to submitted
});

export const PROPOSAL_LIMITS = Object.freeze({
  COVER_LETTER_MIN: 50,
  COVER_LETTER_MAX: 5000,
  MILESTONES_MAX: 20,
  MILESTONE_TITLE_MAX: 150,
  MILESTONE_DESC_MAX: 1000,
  REVIEW_NOTE_MAX: 1000,
  BID_MAX: 10000000,
  DAYS_MAX: 3650,
  AI_NOTES_MAX: 1000,
});

export const MESSAGE_LIMITS = Object.freeze({
  TEXT_MAX: 4000,
  PAGE_LIMIT: 30,
});

// Hiring and project-management lifecycle values.
export const OFFER_STATUS = Object.freeze({ DRAFT: 'draft', SENT: 'sent', VIEWED: 'viewed', CHANGES_REQUESTED: 'changes_requested', ACCEPTED: 'accepted', REJECTED: 'rejected', WITHDRAWN: 'withdrawn', EXPIRED: 'expired' });
export const CONTRACT_STATUS = Object.freeze({ DRAFT: 'draft', ACTIVE: 'active', PAUSED: 'paused', ENDED: 'ended', COMPLETED: 'completed', CANCELLED: 'cancelled', DISPUTED: 'disputed', SUSPENDED: 'suspended' });
export const TIME_ENTRY_SOURCE = Object.freeze({ TIMER: 'timer', MANUAL: 'manual', IMPORTED: 'imported', DESKTOP_TRACKER: 'desktop_tracker' });
export const TIME_ENTRY_STATUS = Object.freeze({ COMPLETED: 'completed', SUBMITTED: 'submitted', APPROVED: 'approved', DISPUTED: 'disputed', REJECTED: 'rejected', DELETED: 'deleted' });
export const HOURLY_INVOICE_STATUS = Object.freeze({ DRAFT: 'draft', GENERATED: 'generated', SUBMITTED: 'submitted', IN_REVIEW: 'in_review', APPROVED: 'approved', PAYMENT_PENDING: 'payment_pending', PAID: 'paid', FAILED: 'failed', DISPUTED: 'disputed', VOID: 'void' });
export const PROJECT_STATUS = Object.freeze({ NOT_STARTED: 'not_started', IN_PROGRESS: 'in_progress', REVIEW: 'review', REVISION: 'revision', COMPLETED: 'completed', CANCELLED: 'cancelled' });
export const MILESTONE_STATUS = Object.freeze({ PENDING: 'pending', FUNDING_PENDING: 'funding_pending', FUNDED: 'funded', IN_PROGRESS: 'in_progress', SUBMITTED: 'submitted', REVISION_REQUESTED: 'revision_requested', APPROVED: 'approved', PAID: 'paid', DISPUTED: 'disputed', CANCELLED: 'cancelled' });
export const SUBMISSION_STATUS = Object.freeze({ SUBMITTED: 'submitted', UNDER_REVIEW: 'under_review', REVISION_REQUESTED: 'revision_requested', APPROVED: 'approved', REJECTED: 'rejected' });
export const PHASE8_LIMITS = Object.freeze({ TITLE_MAX: 200, DESCRIPTION_MAX: 20000, TERMS_MAX: 10000, MILESTONES_MAX: 50, LINKS_MAX: 20, FEEDBACK_MAX: 5000 });
export const PAYMENT_STATUS = Object.freeze({ CREATED: 'created', CHECKOUT_CREATED: 'checkout_created', PROCESSING: 'processing', SUCCEEDED: 'succeeded', FAILED: 'failed', CANCELLED: 'cancelled', REFUND_PENDING: 'refund_pending', REFUNDED: 'refunded', PARTIALLY_REFUNDED: 'partially_refunded', DISPUTED: 'disputed' });
export const ESCROW_STATUS = Object.freeze({ NOT_FUNDED: 'not_funded', FUNDING_PENDING: 'funding_pending', FUNDED: 'funded', RELEASE_PENDING: 'release_pending', RELEASED: 'released', REFUND_PENDING: 'refund_pending', REFUNDED: 'refunded', DISPUTED: 'disputed' });
export const REVIEW_CATEGORIES = Object.freeze({ freelancer: ['quality', 'communication', 'timeliness', 'professionalism'], client: ['communication', 'clarity', 'professionalism', 'cooperation'] });
export const REVIEW_STATUS = Object.freeze({ DRAFT: 'draft', PENDING: 'pending', PUBLISHED: 'published', HIDDEN: 'hidden', REMOVED: 'removed', FLAGGED: 'flagged' });
export const AGENCY_STATUS = Object.freeze({ ACTIVE: 'active', PAUSED: 'paused', SUSPENDED: 'suspended', CLOSED: 'closed' });
export const AGENCY_VISIBILITY = Object.freeze({ PUBLIC: 'public', PRIVATE: 'private', UNLISTED: 'unlisted' });
export const AGENCY_ROLES = Object.freeze({ OWNER: 'owner', ADMIN: 'admin', MANAGER: 'manager', MEMBER: 'member' });

// Phase 24 simulated marketplace card and wallet domain.
export const PHASE24_FINANCE = Object.freeze({ CURRENCY: 'BDT', ACTIVATION_MINIMUM: 500, CARD_NETWORK: 'TalentHive Network', CARD_TYPE: 'developer' });
export const VIRTUAL_CARD_STATUS = Object.freeze({ PENDING: 'pending', INACTIVE: 'inactive', ACTIVE: 'active', SUSPENDED: 'suspended', BLOCKED: 'blocked', EXPIRED: 'expired', CANCELLED: 'cancelled' });
export const SIMULATED_PROVIDER = Object.freeze({ BKASH: 'BKASH_SIMULATED', NAGAD: 'NAGAD_SIMULATED', ROCKET: 'ROCKET_SIMULATED' });
export const SIMULATED_PAYMENT_STATUS = Object.freeze({ PENDING: 'pending', PROCESSING: 'processing', SUCCESS: 'success', FAILED: 'failed', CANCELLED: 'cancelled' });
export const LEDGER_ENTRY_TYPE = Object.freeze({ CARD_RELOAD: 'card_reload', CLIENT_PAYMENT: 'client_payment', DEVELOPER_EARNING: 'developer_earning', PLATFORM_FEE: 'platform_fee', REFUND: 'refund', ADJUSTMENT: 'adjustment', WITHDRAWAL: 'withdrawal' });

// Cover-letter tones offered by the AI assistant.
export const PROPOSAL_TONE = Object.freeze({
  PROFESSIONAL: 'professional',
  FRIENDLY: 'friendly',
  CONCISE: 'concise',
});
