// Small presentation helpers shared across pages.

/** Resolve a stored file URL. Absolute (ImgBB) URLs pass through; relative `/api/...` are proxied. */
export function fileUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return url; // relative /api/files/... is served via the dev proxy / same origin
}

/** Initials for avatar fallback. */
export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function formatRate(rate) {
  if (!rate || rate <= 0) return 'Rate not set';
  return `$${Number(rate).toLocaleString()}/hr`;
}

/** Format a job budget object { type, min, max, currency }. */
export function formatBudget(budget) {
  if (!budget) return 'Budget not set';
  const { type, min = 0, max = 0 } = budget;
  const suffix = type === 'hourly' ? '/hr' : '';
  const money = (n) => `$${Number(n || 0).toLocaleString()}`;
  if (!min && !max) return 'Budget not set';
  if (min && max && min !== max) return `${money(min)} – ${money(max)}${suffix}`;
  return `${money(max || min)}${suffix}`;
}

/** "3 days ago" style relative time. */
export function timeAgo(date) {
  if (!date) return '';
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [name, s] of units) {
    const v = Math.floor(secs / s);
    if (v >= 1) return `${v} ${name}${v === 1 ? '' : 's'} ago`;
  }
  return 'just now';
}

const YEAR = (d) => (d ? new Date(d).getFullYear() : '');

/** "2019 – Present" style range from start/end + current flag. */
export function dateRange(start, end, current) {
  const s = YEAR(start);
  const e = current ? 'Present' : YEAR(end);
  if (!s && !e) return '';
  return [s, e].filter(Boolean).join(' – ');
}
