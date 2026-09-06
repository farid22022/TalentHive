import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, Eye, EyeOff, Pencil, Undo2, RotateCcw, Sparkles, Clock } from 'lucide-react';
import { useMyProposals, useWithdrawProposal } from '../services/proposals.js';
import { apiErrorMessage } from '../api/client.js';
import { formatBudget, timeAgo } from '../utils/format.js';
import {
  ACTIVE_PROPOSAL_STATUSES,
  PROPOSAL_STATUS_BADGES,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_OPTIONS,
} from '../constants/index.js';
import { Button } from '../components/Button.jsx';
import { Skeleton } from '../components/Loaders.jsx';

const FILTERS = [{ value: '', label: 'All' }, ...PROPOSAL_STATUS_OPTIONS];

const idOf = (x) => (x ? x._id || x.id : undefined);
const bidLabel = (bid) => `$${Number(bid?.amount || 0).toLocaleString()}${bid?.type === 'hourly' ? '/hr' : ''}`;

/** Freelancer view: every proposal I sent, with revise / withdraw / re-apply actions. */
export default function MyProposals() {
  const [status, setStatus] = useState('');
  const params = { limit: 20 };
  if (status) params.status = status;

  const { data, isLoading } = useMyProposals(params, { keepPreviousData: true });
  const withdraw = useWithdrawProposal();
  const items = data?.items || [];

  const onWithdraw = (id) => {
    if (!window.confirm('Withdraw this proposal? The client will no longer see it in their queue.')) return;
    withdraw.mutate(id, {
      onSuccess: () => toast.success('Proposal withdrawn'),
      onError: (err) => toast.error(apiErrorMessage(err, 'Could not withdraw the proposal')),
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My proposals</h1>
        <p className="mt-1 text-slate-500">Track what you sent, revise it, or withdraw it.</p>
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
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <FileText className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 font-medium text-slate-700">Nothing here yet</p>
          <p className="mt-1 text-sm text-slate-500">Find a project that fits and send your first proposal.</p>
          <Link to="/find-jobs" className="mt-4 inline-block"><Button size="sm">Browse jobs</Button></Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((p) => {
            const id = idOf(p);
            const jobId = idOf(p.job);
            const active = ACTIVE_PROPOSAL_STATUSES.includes(p.status);
            return (
              <li key={id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {jobId ? (
                        <Link to={`/jobs/${jobId}`} className="font-semibold text-slate-900 hover:text-brand-600">
                          {p.job?.title || 'Untitled job'}
                        </Link>
                      ) : (
                        <span className="font-semibold text-slate-500">Job no longer available</span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROPOSAL_STATUS_BADGES[p.status] || 'bg-slate-100 text-slate-600'}`}>
                        {PROPOSAL_STATUS_LABELS[p.status] || p.status}
                      </span>
                      {p.aiAssisted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                          <Sparkles className="h-3 w-3" /> AI-assisted
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span className="font-medium text-slate-600">Your bid {bidLabel(p.bid)}</span>
                      {p.estimatedDays > 0 && <span>{p.estimatedDays} days</span>}
                      {p.job?.budget && <span>Budget {formatBudget(p.job.budget)}</span>}
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {timeAgo(p.createdAt)}</span>
                      <span className="inline-flex items-center gap-1">
                        {p.viewedAt ? (
                          <><Eye className="h-3.5 w-3.5" /> Viewed {timeAgo(p.viewedAt)}</>
                        ) : (
                          <><EyeOff className="h-3.5 w-3.5" /> Not opened yet</>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {active && (
                      <>
                        <Link to={`/dashboard/proposals/${id}/edit`}>
                          <Button variant="secondary" size="sm"><Pencil className="h-4 w-4" /> Revise</Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onWithdraw(id)}
                          loading={withdraw.isPending && withdraw.variables === id}
                        >
                          <Undo2 className="h-4 w-4" /> Withdraw
                        </Button>
                      </>
                    )}
                    {p.status === 'withdrawn' && jobId && p.job?.status === 'open' && (
                      <Link to={`/dashboard/jobs/${jobId}/apply`}>
                        <Button size="sm"><RotateCcw className="h-4 w-4" /> Apply again</Button>
                      </Link>
                    )}
                  </div>
                </div>

                <p className="mt-3 line-clamp-3 whitespace-pre-line text-sm text-slate-600">{p.coverLetter}</p>

                {p.reviewNote && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Note from the client</div>
                    <p className="mt-1 text-sm text-slate-700">{p.reviewNote}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
