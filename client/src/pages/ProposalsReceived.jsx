import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Inbox, X, Clock, Eye, Sparkles, Star, ThumbsDown, RotateCcw, ListChecks, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useReceivedProposals, useProposal, useDecideProposal } from '../services/proposals.js';
import { useJob } from '../services/jobs.js';
import { apiErrorMessage } from '../api/client.js';
import { fileUrl, initials, formatRate, timeAgo } from '../utils/format.js';
import {
  PROPOSAL_DECISIONS,
  PROPOSAL_LIMITS,
  PROPOSAL_SORTS,
  PROPOSAL_STATUS_BADGES,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_OPTIONS,
} from '../constants/index.js';
import { VerificationBadges } from '../components/VerificationBadges.jsx';
import { Button } from '../components/Button.jsx';
import { Select } from '../components/Select.jsx';
import { Textarea } from '../components/Textarea.jsx';
import { Skeleton } from '../components/Loaders.jsx';

const FILTERS = [{ value: '', label: 'All' }, ...PROPOSAL_STATUS_OPTIONS];

const DECISION_TOAST = {
  [PROPOSAL_DECISIONS.SHORTLIST]: 'Shortlisted',
  [PROPOSAL_DECISIONS.REJECT]: 'Marked as not a fit',
  [PROPOSAL_DECISIONS.RECONSIDER]: 'Moved back to review',
};

const idOf = (x) => (x ? x._id || x.id : undefined);
const bidLabel = (bid) => `$${Number(bid?.amount || 0).toLocaleString()}${bid?.type === 'hourly' ? '/hr' : ''}`;

/** Client view: the review queue for received proposals, optionally narrowed to one job. */
export default function ProposalsReceived() {
  const [search, setSearch] = useSearchParams();
  const jobFilter = search.get('job') || '';
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('recent');

  const params = { limit: 20, sort };
  if (status) params.status = status;
  if (jobFilter) params.job = jobFilter;

  const { data, isLoading } = useReceivedProposals(params, { keepPreviousData: true });
  const { data: job } = useJob(jobFilter, { enabled: !!jobFilter });
  const decide = useDecideProposal();
  const items = data?.items || [];

  const onDecide = (id, decision, reviewNote) =>
    decide.mutate(
      { id, decision, reviewNote: reviewNote?.trim() ? reviewNote.trim() : undefined },
      {
        onSuccess: () => toast.success(DECISION_TOAST[decision] || 'Updated'),
        onError: (err) => toast.error(apiErrorMessage(err, 'Could not update this proposal')),
      }
    );

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Proposals received</h1>
        <p className="mt-1 text-slate-500">
          {data?.pagination?.total ? `${data.pagination.total} in total` : 'Review, shortlist and reply.'}
        </p>
      </div>

      {jobFilter && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/50 p-3 text-sm">
          <span className="text-slate-600">Showing proposals for</span>
          <Link to={`/jobs/${jobFilter}`} className="font-medium text-brand-700 hover:underline">
            {job?.title || 'this job'}
          </Link>
          <button
            type="button"
            onClick={() => setSearch({}, { replace: true })}
            className="ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-slate-500 hover:bg-white hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" /> Show all jobs
          </button>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2">
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
        <div className="w-48 shrink-0">
          <Select
            name="sort"
            aria-label="Sort proposals"
            options={PROPOSAL_SORTS}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <Inbox className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 font-medium text-slate-700">No proposals yet</p>
          <p className="mt-1 text-sm text-slate-500">
            {status ? 'Nothing matches this filter.' : 'Freelancers will show up here as they apply.'}
          </p>
          <Link to="/dashboard/jobs" className="mt-4 inline-block"><Button size="sm">My jobs</Button></Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {items.map((p) => (
            <ReceivedCard
              key={idOf(p)}
              proposal={p}
              showJob={!jobFilter}
              onDecide={onDecide}
              busy={decide.isPending && decide.variables?.id === idOf(p)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * One proposal in the review queue. Expanding it fetches the full record — which is also how
 * the backend records that the client has read it (`viewedAt`).
 */
function ReceivedCard({ proposal, showJob, onDecide, busy }) {
  const id = idOf(proposal);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(proposal.reviewNote || '');
  const { data: full } = useProposal(id, { enabled: open });

  const p = full || proposal;
  const u = p.freelancer || {};
  const prof = p.freelancerProfile || {};
  const shortlisted = p.status === 'shortlisted';
  const rejected = p.status === 'rejected';
  const decidable = p.status !== 'withdrawn' && p.status !== 'accepted';

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        {u.avatar ? (
          <img src={fileUrl(u.avatar)} alt={u.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
            {initials(u.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/freelancers/${idOf(u)}`} className="font-semibold text-slate-900 hover:text-brand-600">
              {u.name || 'Freelancer'}
            </Link>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PROPOSAL_STATUS_BADGES[p.status] || 'bg-slate-100 text-slate-600'}`}>
              {PROPOSAL_STATUS_LABELS[p.status] || p.status}
            </span>
            {p.aiAssisted && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700"
                title="The freelancer disclosed that this letter started from an AI draft"
              >
                <Sparkles className="h-3 w-3" /> AI-assisted
              </span>
            )}
          </div>
          {prof.title && <p className="truncate text-sm text-slate-600">{prof.title}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            {prof.hourlyRate > 0 && <span>{formatRate(prof.hourlyRate)}</span>}
            {prof.completeness > 0 && <span>{prof.completeness}% profile</span>}
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {timeAgo(p.createdAt)}</span>
            {p.viewedAt && (
              <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> Read {timeAgo(p.viewedAt)}</span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-semibold text-slate-900">{bidLabel(p.bid)}</div>
          {p.estimatedDays > 0 && <div className="text-xs text-slate-400">{p.estimatedDays} days</div>}
        </div>
      </div>

      {showJob && p.job?.title && (
        <p className="mt-3 text-xs text-slate-400">
          for{' '}
          <Link to={`/jobs/${idOf(p.job)}`} className="font-medium text-slate-600 hover:text-brand-600">
            {p.job.title}
          </Link>
        </p>
      )}

      <VerificationBadges badges={prof.badges || []} size="sm" className="mt-3" />

      {prof.skills?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {prof.skills.slice(0, 6).map((s) => (
            <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s}</span>
          ))}
          {prof.skills.length > 6 && <span className="text-xs text-slate-400">+{prof.skills.length - 6}</span>}
        </div>
      )}

      <p className={`mt-3 whitespace-pre-line text-sm text-slate-600 ${open ? '' : 'line-clamp-3'}`}>
        {p.coverLetter}
      </p>

      {open && p.milestones?.length > 0 && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <ListChecks className="h-4 w-4 text-brand-600" /> Proposed milestones
          </div>
          <ul className="mt-2 space-y-1.5 text-sm">
            {p.milestones.map((m, i) => (
              <li key={m._id || i} className="flex justify-between gap-3">
                <span className="min-w-0 text-slate-700">
                  {m.title}
                  {m.description && <span className="block text-xs text-slate-500">{m.description}</span>}
                </span>
                <span className="shrink-0 text-slate-500">
                  ${Number(m.amount || 0).toLocaleString()}
                  {m.dueDate && <span className="ml-1 text-xs">· {new Date(m.dueDate).toLocaleDateString()}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
      >
        {open ? (
          <><ChevronUp className="h-4 w-4" /> Show less</>
        ) : (
          <><ChevronDown className="h-4 w-4" /> Read full proposal</>
        )}
      </button>

      {decidable ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Textarea
            label="Note for the freelancer (optional)"
            name={`reviewNote-${id}`}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={PROPOSAL_LIMITS.REVIEW_NOTE_MAX}
            placeholder="Sent with your decision — keep it specific and kind."
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {!shortlisted && (
              <Button size="sm" loading={busy} onClick={() => onDecide(id, PROPOSAL_DECISIONS.SHORTLIST, note)}>
                <Star className="h-4 w-4" /> Shortlist
              </Button>
            )}
            {!rejected && (
              <Button size="sm" variant="secondary" loading={busy} onClick={() => onDecide(id, PROPOSAL_DECISIONS.REJECT, note)}>
                <ThumbsDown className="h-4 w-4" /> Not a fit
              </Button>
            )}
            {(shortlisted || rejected) && (
              <Button size="sm" variant="ghost" loading={busy} onClick={() => onDecide(id, PROPOSAL_DECISIONS.RECONSIDER, note)}>
                <RotateCcw className="h-4 w-4" /> Back to review
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Shortlisting is not a hire — it flags the strongest candidates and shares your note with them.
          </p>
        </div>
      ) : (
        <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
          {p.status === 'withdrawn'
            ? 'The freelancer withdrew this proposal.'
            : 'You hired this freelancer for the job.'}
        </p>
      )}
    </li>
  );
}
