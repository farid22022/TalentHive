import { useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Mail, Phone, IdCard, Upload, X, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import {
  useVerificationStatus, useResendEmail, useSendPhoneCode, useVerifyPhone,
  useSubmitRequest, useMyRequests, useCancelRequest,
} from '../services/verification.js';
import { apiErrorMessage } from '../api/client.js';
import { Button } from '../components/Button.jsx';
import { Input } from '../components/Input.jsx';
import { Textarea } from '../components/Textarea.jsx';
import { Skeleton } from '../components/Loaders.jsx';
import { VerificationBadges } from '../components/VerificationBadges.jsx';

const STATUS_STYLES = {
  pending: { icon: Clock, cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
  approved: { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  rejected: { icon: XCircle, cls: 'bg-red-50 text-red-700 ring-red-200' },
  cancelled: { icon: X, cls: 'bg-slate-50 text-slate-500 ring-slate-200' },
};
const TYPE_LABELS = { identity: 'Identity', document: 'Document' };

function fmtDate(d) {
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function Card({ title, icon: Icon, children, done }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-slate-900">
          {Icon && <Icon className="h-5 w-5 text-brand-600" />} {title}
        </h2>
        {done && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Done</span>}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function Verification() {
  const { data: status, isLoading } = useVerificationStatus();
  const { data: requests } = useMyRequests();
  const resendEmail = useResendEmail();
  const sendPhone = useSendPhoneCode();
  const verifyPhone = useVerifyPhone();
  const submitReq = useSubmitRequest();
  const cancelReq = useCancelRequest();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [reqType, setReqType] = useState('identity');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState([]);

  const onResendEmail = async () => {
    try { await resendEmail.mutateAsync(); toast.success('Verification email sent — check your inbox (or server logs in dev).'); }
    catch (err) { toast.error(apiErrorMessage(err, 'Could not send email')); }
  };

  const onSendCode = async () => {
    try {
      const out = await sendPhone.mutateAsync(phone.trim() || undefined);
      setCodeSent(true);
      toast.success(out.devCode ? `Code sent (dev code: ${out.devCode})` : 'Verification code sent');
    } catch (err) { toast.error(apiErrorMessage(err, 'Could not send code')); }
  };

  const onVerifyPhone = async () => {
    try { await verifyPhone.mutateAsync(code.trim()); setCode(''); setCodeSent(false); toast.success('Phone verified'); }
    catch (err) { toast.error(apiErrorMessage(err, 'Verification failed')); }
  };

  const onSubmitRequest = async (e) => {
    e.preventDefault();
    if (!files.length) { toast.error('Please attach at least one document'); return; }
    try {
      await submitReq.mutateAsync({ type: reqType, note: note.trim(), files });
      setNote(''); setFiles([]);
      toast.success('Verification request submitted for review');
    } catch (err) { toast.error(apiErrorMessage(err, 'Could not submit request')); }
  };

  const onCancel = async (id) => {
    try { await cancelReq.mutateAsync(id); toast.success('Request cancelled'); }
    catch (err) { toast.error(apiErrorMessage(err)); }
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;

  const emailDone = !!status?.emailVerified;
  const phoneDone = !!status?.phoneVerified;
  const hasPendingIdentity = requests?.some((r) => r.type === 'identity' && r.status === 'pending');
  const hasPendingDocument = requests?.some((r) => r.type === 'document' && r.status === 'pending');
  const pendingForType = reqType === 'identity' ? hasPendingIdentity : hasPendingDocument;

  return (
    <div className="pb-16">
      <div className="flex items-center gap-2 text-brand-700">
        <ShieldCheck className="h-5 w-5" />
        <h1 className="text-2xl font-bold text-slate-900">Verification</h1>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Build trust with clients. Verify your email, phone, and identity to earn badges on your public profile.
      </p>

      {status?.badges?.length > 0 && (
        <div className="mt-4">
          <VerificationBadges badges={status.badges} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Email */}
        <Card title="Email address" icon={Mail} done={emailDone}>
          {emailDone ? (
            <p className="text-sm text-slate-600">Your email address is verified.</p>
          ) : (
            <>
              <p className="text-sm text-slate-600">Confirm your email to secure your account and earn the Email badge.</p>
              <Button className="mt-3" variant="secondary" onClick={onResendEmail} loading={resendEmail.isPending}>
                <Mail className="h-4 w-4" /> Resend verification email
              </Button>
            </>
          )}
        </Card>

        {/* Phone */}
        <Card title="Phone number" icon={Phone} done={phoneDone}>
          {phoneDone ? (
            <p className="text-sm text-slate-600">Verified: <span className="font-medium">{status.phone}</span></p>
          ) : (
            <div className="space-y-3">
              <Input
                label="Phone number"
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={status?.phone || '+1 555 010 0000'}
              />
              <div className="flex flex-wrap items-end gap-2">
                <Button variant="secondary" onClick={onSendCode} loading={sendPhone.isPending}>Send code</Button>
                {codeSent && (
                  <>
                    <Input name="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" className="w-32" />
                    <Button onClick={onVerifyPhone} loading={verifyPhone.isPending}>Verify</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* PLACEHOLDER_REQUESTS */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Submit identity/document request */}
        <Card title="Identity & document review" icon={IdCard}>
          <div className="mb-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>Documents are reviewed privately by our team. Verification confirms identity for trust badges only — it is not legal identity verification.</p>
          </div>
          <form onSubmit={onSubmitRequest} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <div className="flex gap-2">
                {['identity', 'document'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setReqType(t)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize ${reqType === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center hover:border-brand-400 hover:bg-brand-50/40">
              <Upload className="h-6 w-6 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Attach documents (PDF, image, or Word — up to 3)</span>
              <span className="text-xs text-slate-400">{files.length ? files.map((f) => f.name).join(', ') : 'No files selected'}</span>
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.txt,image/*"
                onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 3))}
              />
            </label>
            <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note for the reviewer…" hint={`${note.length}/1000`} />
            <Button type="submit" loading={submitReq.isPending} disabled={pendingForType}>
              {pendingForType ? `A ${reqType} request is already pending` : 'Submit for review'}
            </Button>
          </form>
        </Card>

        {/* My requests */}
        <Card title="My requests" icon={Clock}>
          {requests?.length ? (
            <ul className="divide-y divide-slate-100">
              {requests.map((r) => {
                const s = STATUS_STYLES[r.status] || STATUS_STYLES.pending;
                const Icon = s.icon;
                return (
                  <li key={r.id || r._id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize text-slate-800">{TYPE_LABELS[r.type] || r.type}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ${s.cls}`}>
                          <Icon className="h-3 w-3" /> {r.status}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">{fmtDate(r.createdAt)} · {r.documents?.length || 0} file(s)</div>
                      {r.reviewNote && <p className="mt-1 text-xs text-slate-500">Reviewer: {r.reviewNote}</p>}
                    </div>
                    {r.status === 'pending' && (
                      <button type="button" onClick={() => onCancel(r.id || r._id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Cancel request">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">You have no verification requests yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
