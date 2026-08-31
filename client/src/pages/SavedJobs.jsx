import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bookmark, X } from 'lucide-react';
import { useSavedJobs, useUnsaveJob } from '../services/jobs.js';
import { apiErrorMessage } from '../api/client.js';
import { formatBudget, timeAgo } from '../utils/format.js';
import { Button } from '../components/Button.jsx';
import { Skeleton } from '../components/Loaders.jsx';

export default function SavedJobs() {
  const { data, isLoading } = useSavedJobs({ limit: 20 });
  const unsave = useUnsaveJob();
  const items = data?.items || [];

  const remove = (id) =>
    unsave.mutate(id, {
      onSuccess: () => toast.success('Removed from saved'),
      onError: (e) => toast.error(apiErrorMessage(e)),
    });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Saved jobs</h1>
      <p className="mt-1 text-slate-500">Jobs you’ve bookmarked to revisit later.</p>

      {isLoading ? (
        <div className="mt-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <Bookmark className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 font-medium text-slate-700">No saved jobs</p>
          <p className="mt-1 text-sm text-slate-500">Browse the job board and save the ones you like.</p>
          <Link to="/find-jobs" className="mt-4 inline-block"><Button size="sm">Find jobs</Button></Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((job) => (
            <li key={job._id || job.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link to={`/jobs/${job._id || job.id}`} className="font-semibold text-slate-900 hover:text-brand-600">{job.title}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    <span>{job.category}</span>
                    <span>{formatBudget(job.budget)}</span>
                    <span>{timeAgo(job.createdAt)}</span>
                  </div>
                  {job.skills?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {job.skills.slice(0, 5).map((s) => <span key={s} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{s}</span>)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => remove(job._id || job.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                  aria-label="Remove from saved"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
