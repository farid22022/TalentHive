import { useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

/**
 * Controlled tag/skill input. `value` is a string[]; `onChange` receives the next array.
 * Enter or comma commits the current token; Backspace on empty removes the last tag.
 */
export function TagInput({ label, value = [], onChange, placeholder = 'Type and press Enter', error, hint, max = 30 }) {
  const [draft, setDraft] = useState('');

  const add = (raw) => {
    const tag = raw.trim().replace(/,$/, '');
    if (!tag) return;
    const exists = value.some((v) => v.toLowerCase() === tag.toLowerCase());
    if (!exists && value.length < max) onChange([...value, tag]);
    setDraft('');
  };

  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      remove(value.length - 1);
    }
  };

  return (
    <div className="w-full">
      {label && <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>}
      <div
        className={clsx(
          'flex flex-wrap gap-2 rounded-lg border px-2 py-2',
          'focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30',
          error ? 'border-red-400' : 'border-slate-300'
        )}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(i)}
              className="rounded-full p-0.5 hover:bg-brand-100"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length >= max ? `Max ${max} reached` : placeholder}
          disabled={value.length >= max}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm focus:outline-none focus:ring-0"
        />
      </div>
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}
