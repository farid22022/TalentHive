import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LoaderCircle, ShieldCheck, Receipt } from 'lucide-react';
import { paymentApi } from '../api/payment.js';
import { hiringApi } from '../api/hiring.js';
import { apiErrorMessage } from '../api/client.js';
import { PaymentFlowAnimation } from './PaymentFlowAnimation.jsx';
import { useHiringMutation } from '../services/hiring.js';
import { pendingPayment, usePaymentSync } from '../services/payments.js';
import { useAuth } from '../context/AuthContext.jsx';

export const money = (value, currency = 'BDT') => new Intl.NumberFormat('en-BD', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' }).format(value || 0);
export const statusLabel = value => ({ checkout_created: 'Payment initiated', processing: 'Payment processing', succeeded: 'Successful', failed: 'Failed', pending: 'Funding required', funded: 'Escrow funded', submitted: 'Awaiting client review', approved: 'Approved — ready to release', paid: 'Payment released', in_progress: 'Work in progress', revision_requested: 'Revision requested' }[value] || value?.replaceAll('_', ' '));
const button = 'rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';

function Checkout({ milestone, workspace, close }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dialog = useRef(null);
  const lock = useRef(false);
  const [provider, setProvider] = useState('BKASH_SIMULATED');
  const [outcome, setOutcome] = useState('success');
  const storageKey = `talenthive:payment:${user._id || user.id}:${milestone._id}`;
  const [key] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    const last = workspace.payments.find(p => p.milestone === milestone._id);
    if (stored && !['failed', 'cancelled'].includes(last?.status)) return stored;
    const next = crypto.randomUUID(); localStorage.setItem(storageKey, next); return next;
  });
  const mutation = useMutation({
    mutationFn: () => paymentApi.fundMilestone(milestone._id, provider, outcome, key),
    onSuccess: ({ payment }) => { navigate(`/dashboard/payments/${payment._id}`); close(); },
    onSettled: () => { lock.current = false; },
  });
  useEffect(() => { dialog.current?.showModal(); void import('../pages/Payments.jsx'); }, []);
  return <dialog ref={dialog} onCancel={close} onClose={close} className="w-[calc(100%-2rem)] max-w-lg rounded-2xl p-0 shadow-xl backdrop:bg-slate-900/50">
    <form className="space-y-5 p-5 sm:p-7" onSubmit={e => { e.preventDefault(); if (!lock.current) { lock.current = true; mutation.mutate(); } }}>
      <div className="flex items-center gap-3"><ShieldCheck className="text-brand-700" /><h2 className="text-xl font-bold">Fund milestone</h2></div>
      <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">Simulation only. No real money, PIN, OTP or card details required.</p>
      <dl className="space-y-2 text-sm"><dt className="text-slate-500">Project</dt><dd>{workspace.project.title}</dd><dt className="text-slate-500">Contract</dt><dd>{(milestone.contractTitle || workspace.contract?.title)}</dd><dt className="text-slate-500">Developer</dt><dd>{(milestone.developer?.name || workspace.project.freelancer?.name)}</dd><dt className="text-slate-500">Milestone</dt><dd className="font-semibold">{milestone.title}</dd></dl>
      <fieldset disabled={mutation.isPending}><legend className="mb-2 font-semibold">Payment method</legend><div className="grid grid-cols-3 gap-2">{['BKASH', 'NAGAD', 'ROCKET'].map(name => <label key={name} className={`flex cursor-pointer flex-wrap items-center gap-2 rounded-xl border p-3 text-sm ${provider === `${name}_SIMULATED` ? 'border-brand-700 bg-brand-50' : ''}`}><input type="radio" name="provider" value={`${name}_SIMULATED`} checked={provider === `${name}_SIMULATED`} onChange={e => setProvider(e.target.value)} />{name === 'BKASH' ? 'bKash' : name === 'NAGAD' ? 'Nagad' : 'Rocket'}</label>)}</div></fieldset>
      {import.meta.env.DEV && <label className="block text-sm">Simulation result<select className="ml-2 rounded border p-2" value={outcome} disabled={mutation.isPending} onChange={e => setOutcome(e.target.value)}><option value="success">Success</option><option value="failed">Provider failure</option></select></label>}
      <div className="flex justify-between border-t pt-4"><span>Total to escrow</span><strong>{money(milestone.amount, workspace.financialSummary.currency)}</strong></div>
      <p className="text-xs text-slate-500">Funds stay in escrow until you review, approve and release the milestone. The platform fee is deducted from the developer payout.</p>
      {mutation.isError && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{apiErrorMessage(mutation.error)} We have not confirmed the result. Retry uses the same payment key, or close and check the project status.</p>}
      <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t bg-white py-3"><button type="button" className="rounded-lg border px-4 py-2" onClick={close}>Cancel</button><button className={button} disabled={mutation.isPending}>{mutation.isPending ? 'Submitting…' : `Pay ${money(milestone.amount, workspace.financialSummary.currency)}`}</button></div>
    </form>
  </dialog>;
}

function WorkActions({ milestone: m, client }) {
  const [review, setReview] = useState(false);
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState('');
  const submissions = useQuery({ queryKey: ['hiring', 'submissions', m._id], queryFn: () => hiringApi.submissions(m._id), enabled: review });
  const action = useHiringMutation(({ kind, id }) => kind === 'start' ? hiringApi.startMilestone(m._id) : kind === 'submit' ? hiringApi.submitWork(m._id, { description }) : kind === 'release' ? paymentApi.release(m._id) : kind === 'approve' ? hiringApi.approve(id, feedback) : hiringApi.requestRevision(id, feedback));
  return <div className="mt-3 space-y-3">
    {!client && ['funded', 'revision_requested'].includes(m.status) && <button className={button} disabled={action.isPending} onClick={() => action.mutate({ kind: 'start' })}>Start work</button>}
    {!client && m.status === 'in_progress' && <form onSubmit={e => { e.preventDefault(); action.mutate({ kind: 'submit' }); }}><label className="text-sm">Work summary / delivery links<textarea required minLength={3} className="my-2 block w-full rounded-lg border p-2" value={description} onChange={e => setDescription(e.target.value)} /></label><button className={button} disabled={action.isPending}>Submit for review</button></form>}
    {client && m.status === 'submitted' && <button className={button} onClick={() => setReview(!review)}>Review work</button>}
    {review && <div className="rounded-lg bg-slate-50 p-3">{submissions.isLoading ? 'Loading submissions…' : submissions.isError ? <button onClick={() => submissions.refetch()}>Unable to load work. Retry</button> : (submissions.data?.submissions || []).map(s => <div key={s._id} className="mb-3"><p className="whitespace-pre-wrap break-words">{s.description}</p>{(s.links || []).map(url => <a key={url} className="block break-all text-brand-700 underline" href={url} target="_blank" rel="noreferrer">{url}</a>)}{s.status === 'submitted' && <><label className="mt-2 block text-sm">Review feedback<textarea className="block w-full rounded border p-2" value={feedback} onChange={e => setFeedback(e.target.value)} /></label><div className="mt-2 flex flex-wrap gap-2"><button disabled={action.isPending} className={button} onClick={() => action.mutate({ kind: 'approve', id: s._id })}>Approve work</button><button disabled={action.isPending || feedback.trim().length < 3} className="rounded-lg border p-2 text-sm disabled:opacity-50" onClick={() => action.mutate({ kind: 'revision', id: s._id })}>Request revision</button></div></>}</div>)}</div>}
    {client && m.status === 'approved' && <button className={button} disabled={action.isPending} onClick={() => action.mutate({ kind: 'release' })}>{action.isPending ? 'Releasing…' : 'Release payment'}</button>}
    {action.isError && <p role="alert" className="text-sm text-red-700">{apiErrorMessage(action.error)}</p>}
  </div>;
}

export function ProjectPayments({ workspace, client }) {
  usePaymentSync();
  const [checkout, setCheckout] = useState(null);
  const summary = workspace.financialSummary;
  return <div className="mt-5 space-y-5 pb-4">
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{[['total', 'Total contract'], ['funded', 'Funded'], ['escrow', 'In escrow'], ['released', 'Released'], ['remaining', 'Remaining']].map(([key, title]) => <div key={key} className="rounded-xl border bg-white p-4"><p className="text-xs text-slate-500">{title}</p><p className="mt-2 break-words text-lg font-bold">{money(summary[key], summary.currency)}</p></div>)}</div>
    {workspace.milestones.map(m => { const payment = workspace.payments.find(p => p.milestone === m._id); return payment ? <PaymentFlowAnimation key={`flow-${m._id}`} payment={payment} milestone={m} /> : null; })}
    <div className="rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">Milestones & payments</h2><p className="mt-1 text-sm text-slate-500">Fund work securely, review delivery, then release escrow.</p>
      {workspace.milestones.length === 0 && <p className="mt-4 rounded-lg bg-slate-50 p-4">No milestones have been agreed for this contract yet.</p>}
      {workspace.milestones.map(m => {
        const payment = workspace.payments.find(p => p.milestone === m._id);
        const pending = pendingPayment(payment);
        return <article key={m._id} className="mt-4 rounded-xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{m.title}</h3><p className="text-sm text-slate-500">{workspace.project.freelancer?.name} · {workspace.contract?.title}</p><p className="mt-2 text-lg font-bold">{money(m.amount, summary.currency)}</p></div><span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{pending && <LoaderCircle size={14} className="motion-safe:animate-spin" />}{pending ? statusLabel(payment.status) : statusLabel(m.status)}</span></div>
          {payment && <div className="mt-3 break-all text-sm"><p className="text-slate-500">{payment.transactionReference}</p><p className={payment.status === 'failed' ? 'text-red-700' : 'text-emerald-700'}>{statusLabel(payment.status)} · Escrow: {statusLabel(payment.escrowStatus)}</p><Link className="mt-1 inline-block font-semibold text-brand-700" to={`/dashboard/payments/${payment._id}`}>{pending ? 'Track payment' : 'View payment'}</Link></div>}
          {client && !pending && (!payment || ['failed', 'cancelled'].includes(payment.status)) && ['pending', 'funding_pending'].includes(m.status) && <button className={`${button} mt-3`} onClick={() => setCheckout(m)}>Fund milestone</button>}
          {!client && m.status === 'pending' && <p className="mt-3 text-sm text-slate-500">Waiting for the client to fund escrow.</p>}
          <WorkActions milestone={m} client={client} />
        </article>;
      })}
    </div>
    <div className="rounded-xl border bg-white p-5"><h2 className="flex items-center gap-2 font-semibold"><Receipt size={18} />Payment history</h2>{workspace.payments.length === 0 ? <p className="mt-3 text-sm text-slate-500">No payments yet. Fund a milestone to get started.</p> : workspace.payments.map(p => <Link key={p._id} to={`/dashboard/payments/${p._id}`} className="mt-3 flex flex-wrap justify-between gap-2 rounded-lg border p-3 text-sm"><span className="min-w-0 break-all">{p.transactionReference}<span className="block text-slate-500">{p.provider.replace('_SIMULATED', '')} · {new Date(p.createdAt).toLocaleString()}</span></span><span>{money(p.amount, p.currency)} · {statusLabel(p.status)}<span className="block text-brand-700">View details →</span></span></Link>)}<Link className="mt-4 inline-block text-sm font-semibold text-brand-700" to="/dashboard/payments">All payments</Link></div>
    {checkout && <Checkout milestone={checkout} workspace={workspace} close={() => setCheckout(null)} />}
  </div>;
}
