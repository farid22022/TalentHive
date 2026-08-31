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
