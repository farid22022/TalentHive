export const ROLES = { FREELANCER: 'freelancer', CLIENT: 'client', ADMIN: 'admin' };

export const NAV_LINKS = [
  { to: '/find-talent', label: 'Find Talent' },
  { to: '/find-jobs', label: 'Find Jobs' },
  { to: '/services', label: 'Services' },
  { to: '/how-it-works', label: 'How It Works' },
];

// Mirror of server/src/config/constants.js (keep in sync).
export const CATEGORIES = [
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
];

export const AVAILABILITY_OPTIONS = [
  { value: 'full_time', label: 'Full-time (40+ hrs/wk)' },
  { value: 'part_time', label: 'Part-time (< 30 hrs/wk)' },
  { value: 'not_available', label: 'Not available' },
];

export const PROFICIENCY_OPTIONS = [
  { value: 'basic', label: 'Basic' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'fluent', label: 'Fluent' },
  { value: 'native', label: 'Native / Bilingual' },
];

export const AVAILABILITY_LABELS = Object.fromEntries(AVAILABILITY_OPTIONS.map((o) => [o.value, o.label]));

// --- Job marketplace (Phase 5) — mirror of server constants ---

export const BUDGET_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Fixed price' },
  { value: 'hourly', label: 'Hourly rate' },
];

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'entry', label: 'Entry level' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

export const JOB_DURATION_OPTIONS = [
  { value: 'short', label: 'Less than 1 month' },
  { value: 'medium', label: '1 to 3 months' },
  { value: 'long', label: '3+ months / ongoing' },
];

export const JOB_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'filled', label: 'Filled' },
];

export const JOB_SORTS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'budget_desc', label: 'Budget: high to low' },
  { value: 'budget_asc', label: 'Budget: low to high' },
];

export const EXPERIENCE_LEVEL_LABELS = Object.fromEntries(EXPERIENCE_LEVEL_OPTIONS.map((o) => [o.value, o.label]));
export const JOB_DURATION_LABELS = Object.fromEntries(JOB_DURATION_OPTIONS.map((o) => [o.value, o.label]));
export const JOB_STATUS_LABELS = Object.fromEntries(JOB_STATUS_OPTIONS.map((o) => [o.value, o.label]));

// --- Proposals (Phase 6) — mirror of server constants ---

export const PROPOSAL_STATUS_OPTIONS = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Not selected' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'accepted', label: 'Hired' },
];

// Pill classes per proposal status (matches the job-status pills in My Jobs).
export const PROPOSAL_STATUS_BADGES = {
  submitted: 'bg-brand-50 text-brand-700',
  shortlisted: 'bg-amber-50 text-amber-700',
  rejected: 'bg-red-50 text-red-700',
  withdrawn: 'bg-slate-100 text-slate-500',
  accepted: 'bg-emerald-50 text-emerald-700',
};

export const PROPOSAL_SORTS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'bid_asc', label: 'Bid: low to high' },
  { value: 'bid_desc', label: 'Bid: high to low' },
];

export const PROPOSAL_TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'concise', label: 'Concise' },
];

export const PROPOSAL_LIMITS = {
  COVER_LETTER_MIN: 50,
  COVER_LETTER_MAX: 5000,
  MILESTONES_MAX: 20,
  REVIEW_NOTE_MAX: 1000,
  AI_NOTES_MAX: 1000,
};

// Statuses a freelancer can still revise or withdraw.
export const ACTIVE_PROPOSAL_STATUSES = ['submitted', 'shortlisted'];

export const PROPOSAL_DECISIONS = { SHORTLIST: 'shortlist', REJECT: 'reject', RECONSIDER: 'reconsider' };

export const PROPOSAL_STATUS_LABELS = Object.fromEntries(PROPOSAL_STATUS_OPTIONS.map((o) => [o.value, o.label]));
