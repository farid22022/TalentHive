import { forwardRef } from 'react';
import clsx from 'clsx';

/** Accessible labeled textarea with error + optional character hint. */
export const Textarea = forwardRef(function Textarea(
  { label, id, error, hint, className, rows = 4, ...props },
  ref
) {
  const areaId = id || props.name;
  const errId = error ? `${areaId}-error` : undefined;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={areaId} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        ref={ref}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={errId}
        className={clsx(
          'w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30',
          error ? 'border-red-400' : 'border-slate-300',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={errId} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
