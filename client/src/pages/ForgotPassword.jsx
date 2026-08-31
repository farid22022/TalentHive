import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth.js';
import { apiErrorMessage } from '../api/client.js';
import { Input } from '../components/Input.jsx';
import { Button } from '../components/Button.jsx';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({ defaultValues: { email: '' } });
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState(null);

  const onSubmit = async ({ email }) => {
    try {
      const res = await authApi.forgotPassword(email);
      setSent(true);
      if (res?.devResetToken) setDevToken(res.devResetToken); // dev convenience only
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
      <p className="mt-1 text-sm text-slate-500">We&apos;ll email you a reset link if the account exists.</p>

      {sent ? (
        <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          If that email exists, a reset link has been sent.
          {devToken && (
            <p className="mt-2 break-all text-xs text-slate-600">
              Dev reset link:{' '}
              <Link className="text-brand-700 underline" to={`/reset-password?token=${devToken}`}>
                /reset-password?token={devToken.slice(0, 12)}…
              </Link>
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <Input label="Email" type="email" autoComplete="email" {...register('email')} />
          <Button type="submit" className="w-full" loading={isSubmitting}>Send reset link</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to="/login" className="font-medium text-brand-700 hover:underline">Back to login</Link>
      </p>
    </div>
  );
}
