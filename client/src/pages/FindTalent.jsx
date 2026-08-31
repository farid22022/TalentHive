import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useTalent } from '../services/profile.js';
import { fileUrl, initials, formatRate } from '../utils/format.js';
import { CATEGORIES, AVAILABILITY_OPTIONS, AVAILABILITY_LABELS } from '../constants/index.js';
import { Select } from '../components/Select.jsx';
import { Button } from '../components/Button.jsx';
import { Skeleton } from '../components/Loaders.jsx';

const SORTS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'rate_asc', label: 'Rate: low to high' },
  { value: 'rate_desc', label: 'Rate: high to low' },
];

function TalentCard({ p }) {
  const u = p.user || {};
  const loc = [p.location?.city, p.location?.country].filter(Boolean).join(', ');
  return (
    <Link
      to={`/freelancers/${u._id || u.id}`}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {u.avatar ? (
          <img src={fileUrl(u.avatar)} alt={u.name} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{initials(u.name)}</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold text-slate-900">{u.name}</h3>
            {p.verificationState === 'VERIFIED' && <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />}
          </div>
          <p className="truncate text-sm text-slate-600">{p.title}</p>
        </div>
        <div className="shrink-0 text-right text-sm font-semibold text-slate-900">{formatRate(p.hourlyRate)}</div>
      </div>

      {p.overview && <p className="mt-3 line-clamp-2 text-sm text-slate-500">{p.overview}</p>}

      {p.skills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {p.skills.slice(0, 5).map((s) => (
            <span key={s} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{s}</span>
          ))}
          {p.skills.length > 5 && <span className="text-xs text-slate-400">+{p.skills.length - 5}</span>}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
        {loc && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {loc}</span>}
        <span>{AVAILABILITY_LABELS[p.availability] || 'Availability n/a'}</span>
      </div>
    </Link>
  );
}

export default function FindTalent() {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ search: '', category: '', availability: '', sort: 'recent', page: 1 });

  const params = { ...filters, limit: 12 };
  // Strip empties so the query key stays stable.
  Object.keys(params).forEach((k) => (params[k] === '' || params[k] == null) && delete params[k]);

  const { data, isLoading, isError } = useTalent(params, { keepPreviousData: true });
  const items = data?.items || [];
  const pagination = data?.pagination;

  const submit = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchInput.trim(), page: 1 }));
  };
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v, page: 1 }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900">Find talent</h1>
        <p className="mt-1 text-slate-500">Browse skilled freelancers ready to work on your project.</p>
      </div>

      {/* Search + filters */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, skill, or keyword"
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Select
            placeholder="All categories"
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            value={filters.category}
            onChange={(e) => setFilter('category', e.target.value)}
          />
          <Select
            placeholder="Any availability"
            options={AVAILABILITY_OPTIONS}
            value={filters.availability}
            onChange={(e) => setFilter('availability', e.target.value)}
          />
          <Select options={SORTS} value={filters.sort} onChange={(e) => setFilter('sort', e.target.value)} />
        </div>
      </div>

      {/* Results */}
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
        <SlidersHorizontal className="h-4 w-4" />
        {isLoading ? 'Searching…' : `${pagination?.total ?? items.length} freelancer${(pagination?.total ?? items.length) === 1 ? '' : 's'} found`}
      </div>

      {isLoading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : isError ? (
        <div className="mt-10 text-center text-slate-500">Could not load talent. Please try again.</div>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="font-medium text-slate-700">No freelancers match your search</p>
          <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or keywords.</p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => <TalentCard key={p._id || p.id} p={p} />)}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={filters.page >= pagination.totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
