import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Briefcase, Bookmark } from 'lucide-react';
import { useMyJobs } from '../services/jobs.js';
import { formatBudget, timeAgo } from '../utils/format.js';
import { JOB_STATUS_LABELS } from '../constants/index.js';
import { Button } from '../components/Button.jsx';
import { Skeleton } from '../components/Loaders.jsx';

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-600',
  open: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-slate-100 text-slate-500',
  filled: 'bg-brand-50 text-brand-700',
};

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'draft', label: 'Drafts' },
  { value: 'closed', label: 'Closed' },
  { value: 'filled', label: 'Filled' },
];

export default function MyJobs() {
  const [status, setStatus] = useState('');
  const params = { limit: 20 };
  if (status) params.status = status;
  const { data, isLoading } = useMyJobs(params, { keepPreviousData: true });
  const items = data?.items || [];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My jobs</h1>
          <p className="mt-1 text-slate-500">Manage the projects you’ve posted.</p>
        </div>
        <Link to="/dashboard/jobs/new"><Button><Plus className="h-4 w-4" /> Post a job</Button></Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            onClick={() => setStatus(f.value)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${status === f.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <Briefcase className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 font-medium text-slate-700">No jobs yet</p>
          <p className="mt-1 text-sm text-slate-500">Post your first job to start receiving proposals.</p>
          <Link to="/dashboard/jobs/new" className="mt-4 inline-block"><Button size="sm">Post a job</Button></Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((job) => (
            <li key={job._id || job.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/jobs/${job._id || job.id}`} className="font-semibold text-slate-900 hover:text-brand-600">{job.title}</Link>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[job.status] || 'bg-slate-100 text-slate-600'}`}>
                      {JOB_STATUS_LABELS[job.status]}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span>{job.category}</span>
                    <span>{formatBudget(job.budget)}</span>
                    <span className="inline-flex items-center gap-1"><Bookmark className="h-3.5 w-3.5" /> {job.savedCount || 0} saved</span>
                    <span>{timeAgo(job.createdAt)}</span>
                  </div>
                </div>
                <Link to={`/dashboard/jobs/${job._id || job.id}/edit`}>
                  <Button variant="secondary" size="sm">Edit</Button>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
