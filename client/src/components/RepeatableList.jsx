import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { Input } from './Input.jsx';
import { Textarea } from './Textarea.jsx';
import { Select } from './Select.jsx';
import { Button } from './Button.jsx';
import { TagInput } from './TagInput.jsx';

const emptyFromFields = (fields) =>
  Object.fromEntries(fields.map((f) => [f.name, f.type === 'checkbox' ? false : f.type === 'tags' ? [] : '']));

/**
 * Generic add/edit/remove list editor for repeatable profile sections.
 * - `fields`: [{ name, label, type, placeholder, colSpan, options }]
 * - `renderSummary(item)`: row content for saved items
 * - `value`: item[]; `onChange(nextItems)`
 */
export function RepeatableList({ title, icon: Icon, fields, value = [], onChange, renderSummary, addLabel = 'Add', emptyText }) {
  const [draft, setDraft] = useState(null); // null = closed; object = editing/adding
  const [editIndex, setEditIndex] = useState(-1);

  const open = (item = emptyFromFields(fields), index = -1) => {
    setDraft(item);
    setEditIndex(index);
  };
  const close = () => {
    setDraft(null);
    setEditIndex(-1);
  };

  const commit = () => {
    const next = [...value];
    if (editIndex >= 0) next[editIndex] = draft;
    else next.push(draft);
    onChange(next);
    close();
  };

  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const set = (name, v) => setDraft((d) => ({ ...d, [name]: v }));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          {Icon && <Icon className="h-5 w-5 text-brand-600" />} {title}
        </h2>
        {!draft && (
          <Button variant="ghost" size="sm" onClick={() => open()}>
            <Plus className="h-4 w-4" /> {addLabel}
          </Button>
        )}
      </div>

      {value.length === 0 && !draft && (
        <p className="mt-3 text-sm text-slate-500">{emptyText || 'Nothing added yet.'}</p>
      )}

      <ul className="mt-3 divide-y divide-slate-100">
        {value.map((item, i) => (
          <li key={i} className="flex items-start justify-between gap-3 py-3">
            <div className="min-w-0 text-sm">{renderSummary(item)}</div>
            <div className="flex shrink-0 gap-1">
              <button type="button" onClick={() => open({ ...item }, i)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Edit">
                <Pencil className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => remove(i)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {draft && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => {
              const common = { key: f.name, label: f.label, className: f.colSpan === 2 ? 'col-span-2' : '' };
              if (f.type === 'textarea')
                return (
                  <div className="col-span-2" key={f.name}>
                    <Textarea label={f.label} value={draft[f.name] || ''} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} rows={3} />
                  </div>
                );
              if (f.type === 'checkbox')
                return (
                  <label key={f.name} className="col-span-2 flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={!!draft[f.name]} onChange={(e) => set(f.name, e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    {f.label}
                  </label>
                );
              if (f.type === 'tags')
                return (
                  <div className="col-span-2" key={f.name}>
                    <TagInput label={f.label} value={draft[f.name] || []} onChange={(v) => set(f.name, v)} placeholder={f.placeholder} />
                  </div>
                );
              if (f.type === 'select')
                return (
                  <div className={f.colSpan === 2 ? 'col-span-2' : ''} key={f.name}>
                    <Select label={f.label} options={f.options || []} value={draft[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />
                  </div>
                );
              return (
                <div className={f.colSpan === 2 ? 'col-span-2' : ''} key={f.name}>
                  <Input
                    label={f.label}
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    value={draft[f.name] ?? ''}
                    onChange={(e) => set(f.name, e.target.value)}
                    placeholder={f.placeholder}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={commit}>
              <Check className="h-4 w-4" /> {editIndex >= 0 ? 'Update' : 'Add'}
            </Button>
            <Button size="sm" variant="ghost" onClick={close}>
              <X className="h-4 w-4" /> Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
