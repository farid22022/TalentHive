import { ShieldCheck, Mail, Phone, BadgeCheck, FileCheck2 } from 'lucide-react';

// Badge slug -> display config. Mirrors server BADGES constant.
export const BADGE_META = {
  verified: { label: 'Verified', icon: ShieldCheck, cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  identity_verified: { label: 'ID Verified', icon: BadgeCheck, cls: 'bg-sky-50 text-sky-700 ring-sky-200' },
  document_verified: { label: 'Docs Verified', icon: FileCheck2, cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  email_verified: { label: 'Email', icon: Mail, cls: 'bg-slate-50 text-slate-600 ring-slate-200' },
  phone_verified: { label: 'Phone', icon: Phone, cls: 'bg-slate-50 text-slate-600 ring-slate-200' },
};

// Order badges by trust weight for display.
const ORDER = ['verified', 'identity_verified', 'document_verified', 'email_verified', 'phone_verified'];

/** Render a row of trust badges. `size="sm"` for compact contexts (cards). */
export function VerificationBadges({ badges = [], size = 'md', className = '' }) {
  const shown = ORDER.filter((b) => badges.includes(b));
  if (!shown.length) return null;
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {shown.map((b) => {
        const meta = BADGE_META[b];
        if (!meta) return null;
        const Icon = meta.icon;
        return (
          <span
            key={b}
            className={`inline-flex items-center gap-1 rounded-full font-medium ring-1 ${meta.cls} ${pad}`}
          >
            <Icon className="h-3.5 w-3.5" /> {meta.label}
          </span>
        );
      })}
    </div>
  );
}
