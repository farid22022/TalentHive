import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, TrendingUp, Bookmark, BookmarkCheck, Pencil, Trash2, Briefcase } from 'lucide-react';
import { useJob, useSaveJob, useUnsaveJob, useDeleteJob, useSavedJobs } from '../services/jobs.js';
import { useAuth } from '../context/AuthContext.jsx';
import { apiErrorMessage } from '../api/client.js';
import { formatBudget, timeAgo, initials, fileUrl } from '../utils/format.js';
import { EXPERIENCE_LEVEL_LABELS, JOB_DURATION_LABELS, JOB_STATUS_LABELS } from '../constants/index.js';
import { Skeleton } from '../components/Loaders.jsx';
import { Button } from '../components/Button.jsx';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { data: job, isLoading, isError } = useJob(id);

  const save = useSaveJob();
  const unsave = useUnsaveJob();
  const del = useDeleteJob();

  // Determine saved state from the caller's saved list (only when logged in).
  const { data: savedData } = useSavedJobs({ limit: 50 }, { enabled: isAuthenticated });
  const isSaved = (savedData?.items || []).some((j) => (j._id || j.id) === id);

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-8 space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;
  }
  if (isError || !job) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Job not available</h1>
        <p className="mt-2 text-slate-500">This job may have been closed or removed.</p>
        <Link to="/find-jobs" className="mt-6 inline-block"><Button variant="secondary">Browse jobs</Button></Link>
      </div>
    );
  }

  const c = job.client || {};
  const ownerId = c._id || c.id;
  const isOwner = isAuthenticated && user && String(ownerId) === String(user._id || user.id);

  const toggleSave = () => {
    if (!isAuthenticated) return navigate('/login');
    const m = isSaved ? unsave : save;
    m.mutate(id, {
      onSuccess: () => toast.success(isSaved ? 'Removed from saved' : 'Saved'),
      onError: (e) => toast.error(apiErrorMessage(e)),
    });
  };

  const remove = () => {
    if (!confirm('Delete this job? This cannot be undone.')) return;
    del.mutate(id, {
      onSuccess: () => { toast.success('Job deleted'); navigate('/dashboard/jobs'); },
      onError: (e) => toast.error(apiErrorMessage(e)),
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/find-jobs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
              {job.status !== 'open' && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{JOB_STATUS_LABELS[job.status]}</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              {job.category && <span>{job.category}</span>}
              {job.experienceLevel && <span className="inline-flex items-center gap-1"><TrendingUp className="h-4 w-4" /> {EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}</span>}
              {job.duration && <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" /> {JOB_DURATION_LABELS[job.duration]}</span>}
              <span>{timeAgo(job.createdAt)}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-bold text-slate-900">{formatBudget(job.budget)}</div>
            <div className="text-xs uppercase tracking-wide text-slate-400">{job.budget?.type === 'hourly' ? 'Hourly' : 'Fixed price'}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {isOwner ? (
            <>
              <Link to={`/dashboard/jobs/${id}/edit`}><Button variant="secondary" size="sm"><Pencil className="h-4 w-4" /> Edit</Button></Link>
              <Button variant="danger" size="sm" onClick={remove} loading={del.isPending}><Trash2 className="h-4 w-4" /> Delete</Button>
            </>
          ) : (
            <>
              <Button size="sm" onClick={() => (isAuthenticated ? toast('Proposals arrive in Phase 6') : navigate('/login'))}>Apply now</Button>
              <Button variant="secondary" size="sm" onClick={toggleSave} loading={save.isPending || unsave.isPending}>
                {isSaved ? <><BookmarkCheck className="h-4 w-4" /> Saved</> : <><Bookmark className="h-4 w-4" /> Save</>}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Job description</h2>
            <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{job.description}</p>
          </section>

          {job.skills?.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">Skills required</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.skills.map((s) => <span key={s} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{s}</span>)}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">About the client</h2>
            <div className="mt-3 flex items-center gap-3">
              {c.avatar ? (
                <img src={fileUrl(c.avatar)} alt={c.name} className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{initials(c.name)}</div>
              )}
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-900">{c.name || 'Client'}</div>
                <div className="text-xs text-slate-500">Member</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
