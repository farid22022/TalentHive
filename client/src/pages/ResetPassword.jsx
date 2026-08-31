import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/auth.js';
import { apiErrorMessage } from '../api/client.js';
import { Input } from '../components/Input.jsx';
import { Button } from '../components/Button.jsx';

const schema = z
  .object({
    newPassword: z.string().min(8, 'At least 8 characters')
      .regex(/[a-z]/, 'Include a lowercase letter').regex(/[A-Z]/, 'Include an uppercase letter').regex(/[0-9]/, 'Include a number'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async ({ newPassword }) => {
    try {
      await authApi.resetPassword({ token, newPassword });
      toast.success('Password reset — please log in');
      navigate('/login');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Reset failed'));
    }
  };

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 text-center">
        <p className="text-slate-600">Invalid or missing reset token.</p>
        <Link to="/forgot-password" className="mt-4 text-brand-700 hover:underline">Request a new link</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Set a new password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <Input label="New password" type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
        <Input label="Confirm password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Reset password</Button>
      </form>
    </div>
  );
}
