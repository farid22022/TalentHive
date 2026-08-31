import { useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, FileText, Check, X, Inbox, ExternalLink } from 'lucide-react';
import { useVerificationQueue, useDecideRequest } from '../../services/verification.js';
import { apiErrorMessage } from '../../api/client.js';
import { fileUrl, initials } from '../../utils/format.js';
import { Button } from '../../components/Button.jsx';
import { Textarea } from '../../components/Textarea.jsx';
import { Skeleton } from '../../components/Loaders.jsx';

const STATUS_TABS = ['pending', 'approved', 'rejected'];
const TYPE_LABELS = { identity: 'Identity', document: 'Document' };

function fmtDate(d) {
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function RequestCard({ req, onDecide, deciding }) {
  const [note, setNote] = useState('');
  const u = req.user || {};
  const decide = (decision) => onDecide({ id: req.id || req._id, decision, reviewNote: note.trim() });

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {u.avatar ? (
            <img src={fileUrl(u.avatar)} alt={u.name} className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <div className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{initials(u.name)}</div>
          )}
          <div>
            <div className="font-semibold text-slate-900">{u.name || 'Unknown user'}</div>
            <div className="text-xs text-slate-500">{u.email}</div>
          </div>
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{TYPE_LABELS[req.type] || req.type}</span>
      </div>

      {req.note && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">“{req.note}”</p>}

      <div className="mt-3">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Documents</div>
        <ul className="mt-1 space-y-1">
          {(req.documents || []).map((d, i) => (
            <li key={i}>
              <a href={fileUrl(d.url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline">
                <FileText className="h-4 w-4" /> {d.filename || `Document ${i + 1}`} <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
          {!req.documents?.length && <li className="text-sm text-slate-400">No documents attached.</li>}
        </ul>
      </div>

      <div className="mt-2 text-xs text-slate-400">Submitted {fmtDate(req.createdAt)}</div>

      {req.status === 'pending' ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reviewer note (shown to the applicant)…" />
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => decide('approve')} loading={deciding}><Check className="h-4 w-4" /> Approve</Button>
            <Button size="sm" variant="danger" onClick={() => decide('reject')} loading={deciding}><X className="h-4 w-4" /> Reject</Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
          <span className={`font-medium capitalize ${req.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}`}>{req.status}</span>
          {req.reviewNote && <span className="text-slate-500"> — {req.reviewNote}</span>}
        </div>
      )}
    </li>
  );
}

export default function VerificationQueue() {
  const [status, setStatus] = useState('pending');
  const { data, isLoading } = useVerificationQueue({ status, limit: 50 });
  const decide = useDecideRequest();

  const onDecide = async (payload) => {
    try {
      await decide.mutateAsync(payload);
      toast.success(`Request ${payload.decision === 'approve' ? 'approved' : 'rejected'}`);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not record decision'));
    }
  };

  return (
    <div className="pb-16">
      <div className="flex items-center gap-2 text-brand-700">
        <ShieldCheck className="h-5 w-5" />
        <h1 className="text-2xl font-bold text-slate-900">Verification Queue</h1>
      </div>
      <p className="mt-1 text-sm text-slate-500">Review identity and document submissions. Approvals grant trust badges — human review only.</p>

      <div className="mt-4 flex gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${status === s ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-4"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
      ) : data?.items?.length ? (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {data.items.map((req) => (
            <RequestCard key={req.id || req._id} req={req} onDecide={onDecide} deciding={decide.isPending} />
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <Inbox className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 font-medium text-slate-700">Nothing here</p>
          <p className="mt-1 text-sm text-slate-500">No {status} verification requests.</p>
        </div>
      )}
    </div>
  );
}
