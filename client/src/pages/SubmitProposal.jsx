import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Sparkles, AlertTriangle, Wand2, Lightbulb, Info, ListChecks, Send } from 'lucide-react';
import { useJob } from '../services/jobs.js';
import { useProposal, useCreateProposal, useUpdateProposal, useMyProposalForJob } from '../services/proposals.js';
import { useDraftProposal } from '../services/ai.js';
import { useAuth } from '../context/AuthContext.jsx';
import { apiErrorMessage } from '../api/client.js';
import { formatBudget } from '../utils/format.js';
import { PROPOSAL_LIMITS, PROPOSAL_TONE_OPTIONS, BUDGET_TYPE_OPTIONS } from '../constants/index.js';
import { Input } from '../components/Input.jsx';
import { Textarea } from '../components/Textarea.jsx';
import { Select } from '../components/Select.jsx';
import { Button } from '../components/Button.jsx';
import { Skeleton } from '../components/Loaders.jsx';
import { RepeatableList } from '../components/RepeatableList.jsx';

const EMPTY = {
  coverLetter: '',
  bid: { amount: '', type: 'fixed', currency: 'USD' },
  estimatedDays: '',
  milestones: [],
  aiAssisted: false,
};

// Optional payment schedule. The client sees it in the review queue; Phase 8 contracts reuse it.
const MILESTONE_FIELDS = [
  { name: 'title', label: 'Milestone', colSpan: 2, placeholder: 'e.g. Design sign-off' },
  { name: 'amount', label: 'Amount $', type: 'number' },
  { name: 'dueDate', label: 'Due date', type: 'date' },
  { name: 'description', label: 'Details', type: 'textarea', placeholder: 'What is delivered at this stage?' },
];

const idOf = (x) => (x ? x._id || x.id : undefined);

/** Submit a new proposal (`mode="create"`, :id is a job) or revise an own one (`mode="edit"`, :id is a proposal). */
export default function SubmitProposal({ mode = 'create' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = mode === 'edit';

  const { data: proposal, isLoading: loadingProposal } = useProposal(id, { enabled: isEdit });
  const jobId = isEdit ? idOf(proposal?.job) : id;
  const { data: job, isLoading: loadingJob } = useJob(jobId, { enabled: !!jobId });
  const { proposal: existing } = useMyProposalForJob(jobId, { enabled: !isEdit && !!jobId });

  const create = useCreateProposal();
  const update = useUpdateProposal();
  const draft = useDraftProposal();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [tone, setTone] = useState('professional');
  const [notes, setNotes] = useState('');
  const [tips, setTips] = useState(null); // last AI draft's talking points + disclaimer

  // Prefill from the proposal being revised.
  useEffect(() => {
    if (!proposal) return;
    setForm({
      coverLetter: proposal.coverLetter || '',
      bid: {
        amount: proposal.bid?.amount ?? '',
        type: proposal.bid?.type || 'fixed',
        currency: proposal.bid?.currency || 'USD',
      },
      estimatedDays: proposal.estimatedDays ?? '',
      milestones: (proposal.milestones || []).map((m) => ({
        title: m.title || '',
        amount: m.amount ?? '',
        dueDate: m.dueDate ? String(m.dueDate).slice(0, 10) : '',
        description: m.description || '',
      })),
      aiAssisted: !!proposal.aiAssisted,
    });
  }, [proposal]);

  // A new proposal defaults to the job's own budget type.
  useEffect(() => {
    if (isEdit || !job?.budget?.type) return;
    setForm((f) => ({ ...f, bid: { ...f.bid, type: job.budget.type } }));
  }, [isEdit, job?.budget?.type]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setBid = (k, v) => setForm((f) => ({ ...f, bid: { ...f.bid, [k]: v } }));

  const validate = () => {
    const e = {};
    const letter = form.coverLetter.trim();
    if (letter.length < PROPOSAL_LIMITS.COVER_LETTER_MIN) {
      e.coverLetter = `Write at least ${PROPOSAL_LIMITS.COVER_LETTER_MIN} characters (${letter.length} so far)`;
    }
    if (!(Number(form.bid.amount) > 0)) e.bid = 'Enter your bid';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = () => ({
    coverLetter: form.coverLetter.trim(),
    bid: {
      amount: Number(form.bid.amount) || 0,
      type: form.bid.type,
      currency: form.bid.currency || 'USD',
    },
    estimatedDays: Math.max(0, Math.round(Number(form.estimatedDays) || 0)),
    milestones: form.milestones
      .filter((m) => (m.title || '').trim().length >= 2)
      .map((m) => ({
        title: m.title.trim(),
        amount: Number(m.amount) || 0,
        ...(m.dueDate ? { dueDate: m.dueDate } : {}),
        description: (m.description || '').trim(),
      })),
    aiAssisted: form.aiAssisted,
  });

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = buildPayload();
    const onError = (err) => toast.error(apiErrorMessage(err, 'Could not save your proposal'));
    const done = (msg) => () => {
      toast.success(msg);
      navigate('/dashboard/proposals');
    };
    if (isEdit) {
      update.mutate({ id, ...payload }, { onSuccess: done('Proposal updated'), onError });
    } else {
      create.mutate({ job: jobId, ...payload }, { onSuccess: done('Proposal submitted'), onError });
    }
  };

  const runDraft = async () => {
    try {
      const d = await draft.mutateAsync({ job: jobId, tone, notes: notes.trim() || undefined });
      setTips(d);
      setForm((f) => ({
        ...f,
        coverLetter: d.coverLetter,
        aiAssisted: true,
        bid: {
          ...f.bid,
          amount: f.bid.amount || d.suggestedBid?.amount || '',
          type: d.suggestedBid?.type || f.bid.type,
        },
        estimatedDays: f.estimatedDays || d.suggestedDays || '',
      }));
      toast.success('Draft ready — edit it before you send');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not draft a cover letter'));
    }
  };

  if ((isEdit && loadingProposal) || loadingJob) {
    return <div className="mx-auto max-w-3xl space-y-4"><Skeleton className="h-24" /><Skeleton className="h-72" /></div>;
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-xl font-bold text-slate-900">Job not available</h1>
        <p className="mt-2 text-sm text-slate-500">It may have been closed or removed.</p>
        <Link to="/find-jobs" className="mt-6 inline-block"><Button variant="secondary">Browse jobs</Button></Link>
      </div>
    );
  }

  const isOwner = String(idOf(job.client)) === String(idOf(user));
  const blocked = !isEdit && existing && existing.status !== 'withdrawn';
  const busy = create.isPending || update.isPending;
  const milestoneTotal = form.milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0);
  const money = (n) => `$${Number(n || 0).toLocaleString()}`;

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <Link to={`/jobs/${jobId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> Back to job
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-slate-900">{isEdit ? 'Revise your proposal' : 'Submit a proposal'}</h1>
      <p className="mt-1 text-slate-500">
        {job.title} · <span className="font-medium text-slate-700">{formatBudget(job.budget)}</span>
      </p>

      {isOwner ? (
        <Notice title="This is your own job">
          You cannot apply to a job you posted.{' '}
          <Link to={`/dashboard/proposals/received?job=${jobId}`} className="font-medium text-brand-700 hover:underline">
            Review the proposals you received
          </Link>{' '}
          instead.
        </Notice>
      ) : blocked ? (
        <Notice title="You have already applied">
          Your proposal for this job is {existing.status}.{' '}
          <Link to={`/dashboard/proposals/${idOf(existing)}/edit`} className="font-medium text-brand-700 hover:underline">
            Revise it
          </Link>{' '}
          or{' '}
          <Link to="/dashboard/proposals" className="font-medium text-brand-700 hover:underline">
            see all your proposals
          </Link>.
        </Notice>
      ) : (
        <>
          {existing?.status === 'withdrawn' && (
            <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              You withdrew an earlier proposal for this job. Submitting again replaces it.
            </p>
          )}

          {/* AI cover-letter assistant — advisory draft only, never auto-submitted. */}
          <section className="mt-6 rounded-xl border border-brand-100 bg-brand-50/40 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-slate-900">
              <Sparkles className="h-5 w-5 text-brand-600" /> AI cover-letter assistant
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Generate a first draft from this job post and your profile, then make it yours.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Select
                label="Tone"
                name="tone"
                options={PROPOSAL_TONE_OPTIONS}
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Anything to emphasise? (optional)"
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. I can start Monday and have built this integration twice"
                  maxLength={1000}
                />
              </div>
            </div>
            <Button type="button" variant="secondary" className="mt-3" onClick={runDraft} loading={draft.isPending}>
              <Wand2 className="h-4 w-4" /> {form.coverLetter ? 'Regenerate draft' : 'Generate draft'}
            </Button>

            {tips && (
              <>
                <div className="mt-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{tips.disclaimer}</p>
                </div>
                {tips.talkingPoints?.length > 0 && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Lightbulb className="h-4 w-4 text-brand-600" /> Make it specific
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                      {tips.talkingPoints.map((p) => <li key={p}>{p}</li>)}
                    </ul>
                  </div>
                )}
                {tips.missingSkills?.length > 0 && (
                  <p className="mt-3 text-xs text-slate-500">
                    Listed on the job but not on your profile: {tips.missingSkills.join(', ')}. Only claim what you can back up.
                  </p>
                )}
              </>
            )}
          </section>

          <form onSubmit={submit} className="mt-6 space-y-5">
            <Textarea
              label="Cover letter"
              name="coverLetter"
              rows={12}
              value={form.coverLetter}
              onChange={(e) => set('coverLetter', e.target.value)}
              error={errors.coverLetter}
              hint={`${form.coverLetter.trim().length} / ${PROPOSAL_LIMITS.COVER_LETTER_MAX} characters`}
              maxLength={PROPOSAL_LIMITS.COVER_LETTER_MAX}
              placeholder="Explain how you would approach this project and why you are the right fit…"
            />

            {(form.aiAssisted || tips) && (
              <label className="flex items-start gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={form.aiAssisted}
                  onChange={(e) => set('aiAssisted', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Disclose that this letter started from an AI draft (shown to the client for transparency).
              </label>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Bid type"
                name="bidType"
                options={BUDGET_TYPE_OPTIONS}
                value={form.bid.type}
                onChange={(e) => setBid('type', e.target.value)}
              />
              <Input
                label={form.bid.type === 'hourly' ? 'Your rate $/hr' : 'Your bid $'}
                name="bidAmount"
                type="number"
                min="0"
                value={form.bid.amount}
                onChange={(e) => setBid('amount', e.target.value)}
                error={errors.bid}
                hint={`Client budget: ${formatBudget(job.budget)}`}
              />
              <Input
                label="Estimated days"
                name="estimatedDays"
                type="number"
                min="0"
                value={form.estimatedDays}
                onChange={(e) => set('estimatedDays', e.target.value)}
              />
            </div>

            <RepeatableList
              title="Payment milestones (optional)"
              icon={ListChecks}
              fields={MILESTONE_FIELDS}
              value={form.milestones}
              onChange={(v) => set('milestones', v.slice(0, PROPOSAL_LIMITS.MILESTONES_MAX))}
              addLabel="Add milestone"
              emptyText="No milestones — the client sees a single payment for your full bid."
              renderSummary={(m) => (
                <>
                  <div className="font-medium text-slate-900">
                    {m.title || 'Untitled'} · {money(m.amount)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {m.dueDate ? `Due ${m.dueDate}` : 'No due date'}
                    {m.description ? ` · ${m.description}` : ''}
                  </div>
                </>
              )}
            />

            {form.milestones.length > 0 && (
              <p className="text-sm text-slate-500">
                Milestones total {money(milestoneTotal)} · your bid is {money(form.bid.amount)}
                {milestoneTotal > 0 && Number(form.bid.amount) > 0 && milestoneTotal !== Number(form.bid.amount) ? (
                  <span className="text-amber-700"> — they do not add up yet.</span>
                ) : null}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={busy}>
                <Send className="h-4 w-4" /> {isEdit ? 'Save changes' : 'Submit proposal'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>

            <p className="text-xs text-slate-400">
              The client sees your name, profile and bid. You can revise or withdraw this proposal until they decide.
            </p>
          </form>
        </>
      )}
    </div>
  );
}

/** Small inline notice used for the "cannot apply" states. */
function Notice({ title, children }) {
  return (
    <div className="mt-6 flex gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
      <div>
        <div className="font-semibold text-slate-900">{title}</div>
        <p className="mt-1 text-sm text-slate-600">{children}</p>
      </div>
    </div>
  );
}
