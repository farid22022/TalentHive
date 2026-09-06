import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MessageSquare, UserRound } from 'lucide-react';
import { conversationsApi } from '../api/messages.js';
import { apiErrorMessage } from '../api/client.js';
import { useReceivedProposals } from '../services/proposals.js';
import { formatCurrency } from '../utils/format.js';

export default function Applicants() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [actionError, setActionError] = useState('');
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

  if (proposals.isLoading) return <div className="p-8 text-slate-500">Loading applicants...</div>;
  if (proposals.isError) return <div className="rounded-xl bg-red-50 p-5 text-red-700">{apiErrorMessage(proposals.error, 'Applicants could not be loaded.')}</div>;

  return (
    <section className="max-w-4xl">
      <Link to="/dashboard/jobs" className="text-sm font-semibold text-brand-600">Back to jobs</Link>
      <h1 className="mt-3 text-3xl font-bold text-slate-900">Applicants</h1>
      <p className="mt-1 text-slate-500">{selectedJob?.title || 'Job'} · {total} proposal{total === 1 ? '' : 's'}</p>
      {actionError && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}
      <div className="mt-6 space-y-4">
        {applicants.length ? applicants.map((proposal) => {
          const freelancer = proposal.freelancer || {};
          const profile = proposal.freelancerProfile || {};
          return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" key={proposal._id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-700"><UserRound /></div>
                <div><h2 className="font-semibold text-slate-900">{freelancer.name || 'Freelancer'}</h2><p className="text-sm text-slate-500">{profile.title || 'Freelance professional'}</p><p className="text-xs text-slate-400">{profile.skills?.slice(0, 5).join(' · ')}</p></div>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">{proposal.status}</span>
            </div>
            <p className="mt-4 line-clamp-3 text-sm text-slate-700">{proposal.coverLetter}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="font-semibold text-slate-900">{formatCurrency(proposal.bid?.amount, proposal.bid?.currency || 'USD')} · {proposal.estimatedDays || '?'} days</span>
              <div className="flex gap-2"><Link to={`/freelancers/${freelancer._id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">View profile</Link><button onClick={() => startConversation(proposal)} className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white"><MessageSquare className="h-4 w-4" /> Message</button></div>
            </div>
          </article>;
        }) : <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No applicants yet.</div>}
      </div>
    </section>
  );
}
