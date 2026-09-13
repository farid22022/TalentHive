import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, CircleAlert, LoaderCircle, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePayment, usePayments, usePaymentSync, pendingPayment } from '../services/payments.js';
import { money, statusLabel } from '../components/ProjectPayments.jsx';

function Details({ id }) {
  const query = usePayment(id);
  const reduced = useReducedMotion();
  if (query.isLoading) return <p role="status">Loading payment…</p>;
  if (!query.data) return <div role="alert" className="rounded-xl border bg-white p-5">Payment unavailable. You may not have access, or the connection may be interrupted. <button className="text-brand-700" onClick={() => query.refetch()}>Try again</button><Link className="mt-4 block text-brand-700" to="/dashboard/projects">Back to projects</Link></div>;
  const p = query.data.payment;
  const pending = pendingPayment(p), success = p.status === 'succeeded', failed = p.status === 'failed';
  const projectId = p.project?._id || p.project;
  const slow = pending && Date.now() - new Date(p.createdAt).getTime() > 20000;
  return <section className="mx-auto max-w-3xl space-y-5 pb-20">
    <Link className="font-semibold text-brand-700" to={`/dashboard/projects/${projectId}`}>← Back to project</Link>
    <div className="rounded-2xl border bg-white p-5 sm:p-8">
      <div aria-live="polite" className="text-center">
        <motion.div key={`${p._id}-${p.status}`} initial={reduced ? false : { opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .35 }} className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
          {pending ? <LoaderCircle className="motion-safe:animate-spin text-brand-700" size={38} /> : success ? <CheckCircle2 className="text-emerald-600" size={38} /> : <CircleAlert className="text-amber-600" size={38} />}
        </motion.div>
        <h1 className="text-2xl font-bold">{pending ? 'Processing payment' : success ? 'Payment successful' : failed ? 'Payment failed' : statusLabel(p.status)}</h1>
        <p className="mt-2 text-3xl font-bold">{money(p.amount, p.currency)}</p>
        <p className="mt-2 text-sm text-slate-500">{p.provider.replace('_SIMULATED', '')} simulation</p>
        <p className="mt-3 break-all text-sm">Transaction: {p.transactionReference}</p>
        {success && <p className="mt-3 font-medium text-emerald-700">{p.escrowStatus === 'released' ? 'Payment released after approval' : 'Escrow funded — review and approve work before releasing payment.'}</p>}
        {failed && <p className="mt-3 text-red-700">{p.failureReason}</p>}
        {pending && <p className="mt-3 text-sm text-slate-600">{slow ? 'This is taking longer than expected. We are still checking your transaction.' : 'Your request is being verified by the server.'} You can safely return to the project; processing continues.</p>}
        {query.isError && <p role="alert" className="mt-3 rounded bg-amber-50 p-3 text-sm">Connection interrupted. Showing the last confirmed status and checking again automatically.</p>}
      </div>
      <ol className="my-6 space-y-3 rounded-xl bg-slate-50 p-4">{[['Payment initiated', p.createdAt], ['Provider processing', p.processingAt], [failed ? 'Provider declined payment' : 'Payment verified', p.completedAt], ['Escrow funded & milestone updated', p.paidAt]].map(([title, date]) => <li key={title} className="flex items-center gap-3 text-sm"><span className={date ? 'text-emerald-700' : 'text-slate-400'}>{date ? '✓' : '○'}</span><span className="flex-1">{title}</span><time className="text-xs text-slate-500">{date ? new Date(date).toLocaleTimeString() : 'Waiting'}</time></li>)}</ol>
      <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">{[['Project', p.project?.title], ['Contract', p.contract?.title], ['Milestone', p.milestone?.title], ['Developer', p.freelancer?.name], ['Escrow', statusLabel(p.escrowStatus)], ['Created', new Date(p.createdAt).toLocaleString()]].map(([title, value]) => <div key={title}><dt className="text-slate-500">{title}</dt><dd className="mt-1 break-words font-medium">{value || '—'}</dd></div>)}</dl>
      <div className="mt-6 flex flex-wrap gap-3"><Link className="rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white" to={`/dashboard/projects/${projectId}`}>{failed ? 'Try again from project' : 'Back to project'}</Link><button className="rounded-lg border px-4 py-2" onClick={() => query.refetch()}>Refresh status</button><Link className="rounded-lg border px-4 py-2" to="/dashboard/payments">All payments</Link></div>
    </div>
    <div className="rounded-xl border bg-white p-5"><h2 className="font-semibold">Payment attempts</h2>{(p.attempts || []).map(a => <div key={a._id} className="mt-3 flex flex-wrap justify-between gap-2 border-t pt-3 text-sm"><span className="break-all">{a.transactionReference}<span className="block text-slate-500">{a.provider.replace('_SIMULATED', '')} · {new Date(a.createdAt).toLocaleString()}</span></span><span>{money(a.amount, a.currency)} · {statusLabel(a.status)}</span></div>)}</div>
  </section>;
}

function History() {
  const { data, isLoading, isError, refetch } = usePayments();
  const [filter, setFilter] = useState('all');
  return <section className="space-y-5 pb-20"><h1 className="text-3xl font-bold">Payments</h1><p className="flex items-center gap-2 text-sm text-slate-500"><ShieldCheck size={18} />Your project payments and escrow status</p><Link to="/dashboard/projects" className="inline-block text-brand-700">Open projects to fund milestones</Link><label className="block text-sm">Status <select value={filter} onChange={e => setFilter(e.target.value)} className="ml-2 rounded-lg border p-2">{['all', 'checkout_created', 'processing', 'succeeded', 'failed', 'refunded', 'partially_refunded', 'cancelled'].map(value => <option key={value} value={value}>{statusLabel(value)}</option>)}</select></label>{isLoading ? <p>Loading payments…</p> : isError ? <p role="alert">Unable to load payments. <button onClick={() => refetch()}>Try again</button></p> : <div className="space-y-3">{data.payments.filter(p => filter === 'all' || p.status === filter).length === 0 && <p className="rounded-xl border bg-white p-5">No payments match this filter.</p>}{data.payments.filter(p => filter === 'all' || p.status === filter).map(p => <Link key={p._id} to={`/dashboard/payments/${p._id}`} className="flex flex-wrap justify-between gap-3 rounded-xl border bg-white p-5"><div className="min-w-0"><h2 className="font-semibold">{p.project?.title} · {p.milestone?.title}</h2><p className="text-sm text-slate-500">{p.freelancer?.name} · {p.provider.replace('_SIMULATED', '')}</p><p className="mt-2 break-all text-xs">{p.transactionReference}</p></div><div><strong>{money(p.amount, p.currency)}</strong><p className="text-sm">{statusLabel(p.status)}</p><span className="text-sm text-brand-700">View details →</span></div></Link>)}</div>}</section>;
}
export default function Payments() { usePaymentSync(); const { paymentId } = useParams(); return paymentId ? <Details id={paymentId} /> : <History />; }
