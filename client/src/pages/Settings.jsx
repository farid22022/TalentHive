import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { changePasswordSchema } from '../validators/auth.schemas.js';
import { authApi } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import { apiErrorMessage } from '../api/client.js';
import { Input } from '../components/Input.jsx';
import { Button } from '../components/Button.jsx';

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(changePasswordSchema),
  });

  const onChangePassword = async (values) => {
    try {
      await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      toast.success('Password changed — please log in again');
      reset();
      await logout();
      navigate('/login');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not change password'));
    }
  };

  const onDelete = async () => {
    if (!window.confirm('Delete your account? This cannot be undone.')) return;
    try {
      await import('../api/client.js').then(({ api }) => api.delete('/auth/account'));
      toast.success('Account deleted');
      await logout();
      navigate('/');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">Change password</h2>
        <form onSubmit={handleSubmit(onChangePassword)} className="mt-4 space-y-4" noValidate>
          <Input label="Current password" type="password" autoComplete="current-password" error={errors.currentPassword?.message} {...register('currentPassword')} />
          <Input label="New password" type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
          <Input label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
          <Button type="submit" loading={isSubmitting}>Update password</Button>
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-800">Danger zone</h2>
        <p className="mt-1 text-sm text-red-700">Permanently delete your account and all associated data.</p>
        <Button variant="danger" className="mt-3" onClick={onDelete}>Delete account</Button>
      </section>
    </div>
  );
}
