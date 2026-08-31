import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, UserRound } from 'lucide-react';
import clsx from 'clsx';
import { registerSchema } from '../validators/auth.schemas.js';
import { useAuth } from '../context/AuthContext.jsx';
import { apiErrorMessage } from '../api/client.js';
import { Input } from '../components/Input.jsx';
import { Button } from '../components/Button.jsx';

export default function Register() {
  const { register: signup } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', role: 'freelancer' },
  });
  const role = watch('role');

  const onSubmit = async (values) => {
    try {
      await signup(values);
      toast.success('Account created!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Registration failed'));
    }
  };

  const roleCard = (value, Icon, title, desc) => (
    <button
      type="button"
      onClick={() => setValue('role', value)}
      className={clsx(
        'flex-1 rounded-xl border p-4 text-left transition',
        role === value ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 hover:border-slate-300'
      )}
      aria-pressed={role === value}
    >
      <Icon className="h-6 w-6 text-brand-600" />
      <div className="mt-2 font-semibold text-slate-900">{title}</div>
      <div className="text-xs text-slate-500">{desc}</div>
    </button>
  );

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500">Join TalentHive as a freelancer or a client.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <div className="flex gap-3">
          {roleCard('freelancer', UserRound, 'Freelancer', 'Find work & get hired')}
          {roleCard('client', Briefcase, 'Client', 'Hire top talent')}
        </div>
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="new-password" hint="8+ chars, mixed case & a number" error={errors.password?.message} {...register('password')} />
        <Button type="submit" className="w-full" loading={isSubmitting}>Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-700 hover:underline">Log in</Link>
      </p>
    </div>
  );
}
