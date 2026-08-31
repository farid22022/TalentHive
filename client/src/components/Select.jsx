import { forwardRef } from 'react';
import clsx from 'clsx';

/** Accessible labeled select. `options` = [{ value, label }]. */
export const Select = forwardRef(function Select(
  { label, id, error, hint, options = [], placeholder, className, children, ...props },
  ref
) {
  const selectId = id || props.name;
  const errId = error ? `${selectId}-error` : undefined;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        aria-invalid={!!error}
        aria-describedby={errId}
        className={clsx(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30',
          error ? 'border-red-400' : 'border-slate-300',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && (
        <p id={errId} className="mt-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
