import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { authApi } from '../api/auth.js';
import { Spinner } from '../components/Loaders.jsx';
import { Button } from '../components/Button.jsx';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState('loading'); // loading | success | error
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard StrictMode double-invoke (token is single-use)
    ran.current = true;
    if (!token) return setStatus('error');
    authApi.verifyEmail(token).then(() => setStatus('success')).catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      {status === 'loading' && <><Spinner className="h-8 w-8" /><p className="mt-4 text-slate-600">Verifying your email…</p></>}
      {status === 'success' && (
        <>
          <CheckCircle2 className="h-12 w-12 text-brand-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Email verified</h1>
          <Link to="/dashboard" className="mt-6"><Button>Go to dashboard</Button></Link>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Verification failed</h1>
          <p className="mt-2 text-slate-500">The link is invalid or has expired.</p>
          <Link to="/dashboard" className="mt-6"><Button variant="secondary">Back to dashboard</Button></Link>
        </>
      )}
    </div>
  );
}
