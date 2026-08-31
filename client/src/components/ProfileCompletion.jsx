import clsx from 'clsx';

/** Compact profile-completeness meter. */
export function ProfileCompletion({ value = 0, className }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const tone = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-brand-500' : 'bg-amber-500';
  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">Profile completeness</span>
        <span className="font-semibold text-slate-900">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={clsx('h-full rounded-full transition-all', tone)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
