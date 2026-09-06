import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BriefcaseBusiness, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { hiringApi } from '../api/hiring.js';
import { apiErrorMessage } from '../api/client.js';
import { useOffers } from '../services/hiring.js';

const idOf = (value) => { const raw = value?.id || value?._id || value; const bytes = raw?.buffer?.data || raw?.buffer; const fromBytes = Array.isArray(bytes) && bytes.length === 12 ? bytes.map((byte) => Number(byte).toString(16).padStart(2, '0')).join('') : null; return typeof raw === 'object' ? raw?.$oid || raw?.toHexString?.() || fromBytes || raw?.toString?.() : raw; };
const money = (value, currency = 'USD') => `${currency} ${Number(value || 0).toLocaleString()}`;

export default function MyOffers() {
  const { data, isLoading, isError, refetch } = useOffers();
  const [busy, setBusy] = useState('');
  const offers = data?.offers || [];

  const act = async (offer, action) => {
    const offerId = idOf(offer);
    setBusy(`${offerId}:${action}`);
    try {
      if (action === 'accept') {
        const result = await hiringApi.acceptOffer(offerId);
        toast.success('Offer accepted. Your contract and project are ready.');
        await refetch();
        if (result.project?._id || result.project?.id) window.location.assign(`/dashboard/projects/${idOf(result.project)}`);
      } else if (action === 'reject') {
        await hiringApi.rejectOffer(offerId);
        toast.success('Offer declined');
        await refetch();
      } else {
        const message = window.prompt('Tell the client what you would like changed:');
        if (!message?.trim()) return;
        await hiringApi.requestChanges(offerId, message.trim());
        toast.success('Change request sent to the client');
        await refetch();
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Offer action could not be completed.'));
    } finally { setBusy(''); }
  };

  if (isLoading) return <div className="p-8 text-slate-500">Loading offers...</div>;
  if (isError) return <div className="rounded-xl bg-red-50 p-5 text-red-700">Offers could not be loaded.</div>;

  return <section className="mx-auto max-w-4xl">
    <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">Freelancer workspace</p>
    <h1 className="mt-1 text-3xl font-bold text-slate-900">My Offers</h1>
    <p className="mt-2 text-slate-500">Review client offers, confirm the terms, and start your contract.</p>
    {!offers.length && <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">No offers yet. Offers from clients will appear here.</div>}
    <div className="mt-6 space-y-4">{offers.map((offer) => {
      const offerId = idOf(offer);
      const actionable = ['sent', 'viewed'].includes(offer.status);
      const client = offer.client || {};
      return <article key={offerId} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-semibold text-slate-900">{offer.title || offer.job?.title || 'Marketplace offer'}</h2><p className="mt-1 text-sm text-slate-500">From {client.name || 'Client'} {offer.job?.title ? `· ${offer.job.title}` : ''}</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-600">{offer.status}</span>
        </div>
        <p className="mt-4 whitespace-pre-line text-sm leading-6 text-slate-700">{offer.description || 'No additional description provided.'}</p>
        <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-3"><div><p className="text-xs text-slate-500">Budget</p><p className="mt-1 font-semibold text-slate-900">{money(offer.totalBudget || offer.rate, offer.currency)}</p></div><div><p className="text-xs text-slate-500">Contract type</p><p className="mt-1 font-semibold capitalize text-slate-900">{offer.contractType || 'fixed'}</p></div><div><p className="text-xs text-slate-500">Delivery</p><p className="mt-1 font-semibold text-slate-900">{offer.endDate ? new Date(offer.endDate).toLocaleDateString() : 'As agreed'}</p></div></div>
        {!!offer.milestones?.length && <div className="mt-5"><h3 className="font-semibold text-slate-900">Milestones</h3><div className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">{offer.milestones.map((m, index) => <div className="flex items-center justify-between gap-3 p-3 text-sm" key={`${offerId}-${index}`}><span>{m.title || `Milestone ${index + 1}`}</span><strong>{money(m.amount, offer.currency)}</strong></div>)}</div></div>}
        {actionable && <div className="mt-6 flex flex-wrap gap-2"><button disabled={!!busy} onClick={() => act(offer, 'accept')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />{busy === `${offerId}:accept` ? 'Accepting...' : 'Accept offer'}</button><button disabled={!!busy} onClick={() => act(offer, 'changes')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"><Clock3 className="h-4 w-4" />Request changes</button><button disabled={!!busy} onClick={() => act(offer, 'reject')} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"><XCircle className="h-4 w-4" />Decline</button></div>}
        {offer.status === 'accepted' && <Link to="/dashboard/projects" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-700"><BriefcaseBusiness className="h-4 w-4" />Open your project</Link>}
      </article>;
    })}</div>
  </section>;
}
