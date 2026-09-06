import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, UserRound, CheckSquare, Square, BriefcaseBusiness } from 'lucide-react';
import { conversationsApi } from '../api/messages.js';
import { apiErrorMessage } from '../api/client.js';
import { useReceivedProposals } from '../services/proposals.js';
import { formatCurrency } from '../utils/format.js';
import { hiringApi } from '../api/hiring.js';

const resourceId = (value) => {
  const candidates = [value, value?._id, value?.id, value?.$oid];
  const raw = candidates.find((candidate) => /^[a-f\d]{24}$/i.test(String(candidate || ''))) || value;
  const bytes = raw?.buffer?.data || raw?.buffer;
  const fromBytes = Array.isArray(bytes) && bytes.length === 12 ? bytes.map((byte) => Number(byte).toString(16).padStart(2, '0')).join('') : null;
  const id = typeof raw === 'object' ? raw?.$oid || raw?.toHexString?.() || fromBytes || raw?.toString?.() : raw;
  if (!/^[a-f\d]{24}$/i.test(String(id || ''))) throw new Error('The offer identifier was not returned by the server. Please refresh and try again.');
  return String(id);
};

export default function Applicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState('');
  const [selected, setSelected] = useState([]);
  const [hiring, setHiring] = useState(false);
  const proposals = useReceivedProposals({ job: jobId, limit: 50, sort: 'recent' });
  const applicants = proposals.data?.items || [];
  const selectedJob = applicants[0]?.job;
  const total = applicants.length;

  const startConversation = async (proposal) => {
    try {
      const conversation = await conversationsApi.createOrOpen({ proposal: proposal._id, type: 'proposal' });
      navigate(`/dashboard/messages/${conversation._id}`);
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Conversation could not be opened.'));
    }
  };

  const toggle = (id) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const hireOne = async (proposal) => {
    const bid = Number(proposal.bid?.amount || 0);
    const milestones = proposal.milestones?.length ? proposal.milestones.map((item) => ({ title: item.title, description: item.description || '', amount: Number(item.amount || 0), ...(item.dueDate ? { dueDate: item.dueDate } : {}) })) : [{ title: 'Project delivery', amount: bid }];
    const result = await hiringApi.createOffer({ job: resourceId(jobId), freelancer: resourceId(proposal.freelancer), contractType: proposal.bid?.type || 'fixed', title: proposal.job?.title || 'Marketplace project', description: `Offer based on proposal: ${(proposal.coverLetter || '').slice(0, 500)}`, rate: bid, totalBudget: bid, estimatedHours: 0, milestones });
    await hiringApi.sendOffer(resourceId(result.offer));
  };
  const hireSelected = async () => {
    setHiring(true); setActionError('');
    try { await Promise.all(applicants.filter((proposal) => selected.includes(proposal._id) && ['submitted', 'shortlisted'].includes(proposal.status) && (!proposal.invitationStatus || proposal.invitationStatus === 'none')).map(hireOne)); setSelected([]); toast.success(`${selected.length} offer${selected.length === 1 ? '' : 's'} sent for acceptance`); }
    catch (err) { setActionError(apiErrorMessage(err, 'Could not create the hire offer.')); }
    finally { setHiring(false); }
  };

  if (proposals.isLoading) return <div className="p-8 text-slate-500">Loading applicants...</div>;
  if (proposals.isError) return <div className="rounded-xl bg-red-50 p-5 text-red-700">{apiErrorMessage(proposals.error, 'Applicants could not be loaded.')}</div>;

  return (
    <section className="max-w-4xl">
      <Link to="/dashboard/jobs" className="text-sm font-semibold text-brand-600">Back to jobs</Link>
      <h1 className="mt-3 text-3xl font-bold text-slate-900">Applicants</h1>
      <p className="mt-1 text-slate-500">{selectedJob?.title || 'Job'} · {total} proposal{total === 1 ? '' : 's'}</p>
      {actionError && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}
      {selected.length > 0 && <div className="mt-5 flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50 p-4"><span className="text-sm font-medium text-brand-800">{selected.length} developer{selected.length === 1 ? '' : 's'} selected</span><button type="button" disabled={hiring} onClick={hireSelected} className="inline-flex items-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><BriefcaseBusiness className="h-4 w-4" />{hiring ? 'Creating offers...' : 'Hire selected developers'}</button></div>}
      <div className="mt-6 space-y-4">
        {applicants.length ? applicants.map((proposal) => {
          const freelancer = proposal.freelancer || {};
          const profile = proposal.freelancerProfile || {};
          return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={proposal._id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                {['submitted', 'shortlisted'].includes(proposal.status) && (!proposal.invitationStatus || proposal.invitationStatus === 'none') && <button type="button" aria-label={`Select ${freelancer.name || 'developer'}`} onClick={() => toggle(proposal._id)} className="text-brand-700">{selected.includes(proposal._id) ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}</button>}
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-700"><UserRound /></div>
                <div><h2 className="font-semibold text-slate-900">{freelancer.name || 'Freelancer'}</h2><p className="text-sm text-slate-500">{profile.title || 'Freelance professional'}</p><p className="text-xs text-slate-400">{profile.skills?.slice(0, 5).join(' · ')}</p></div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">{proposal.invitationStatus && proposal.invitationStatus !== 'none' ? `Invitation ${proposal.invitationStatus.replace('_', ' ')}` : proposal.status}</span>
            </div>
            <p className="mt-4 line-clamp-3 text-sm text-slate-700">{proposal.coverLetter}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="font-semibold text-slate-900">{formatCurrency(proposal.bid?.amount, proposal.bid?.currency || 'USD')} · {proposal.estimatedDays || '?'} days</span>
              <div className="flex flex-wrap gap-2"><Link to={`/freelancers/${freelancer._id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">View profile</Link><button onClick={() => startConversation(proposal)} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white"><MessageSquare className="h-4 w-4" /> Message</button>{['submitted', 'shortlisted'].includes(proposal.status) && (!proposal.invitationStatus || proposal.invitationStatus === 'none') && <button onClick={async () => { setHiring(true); try { await hireOne(proposal); toast.success('Offer sent for acceptance'); } catch (err) { setActionError(apiErrorMessage(err, 'Could not create the hire offer.')); } finally { setHiring(false); } }} disabled={hiring} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"><BriefcaseBusiness className="h-4 w-4" /> Hire developer</button>}</div>
            </div>
          </article>;
        }) : <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No applicants yet.</div>}
      </div>
    </section>
  );
}

