import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useCreateJob, useUpdateJob, useJob } from '../services/jobs.js';
import { apiErrorMessage } from '../api/client.js';
import {
  CATEGORIES,
  BUDGET_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
  JOB_DURATION_OPTIONS,
} from '../constants/index.js';
import { Input } from '../components/Input.jsx';
import { Textarea } from '../components/Textarea.jsx';
import { Select } from '../components/Select.jsx';
import { TagInput } from '../components/TagInput.jsx';
import { Button } from '../components/Button.jsx';
import { Skeleton } from '../components/Loaders.jsx';

const EMPTY = {
  title: '',
  description: '',
  category: '',
  skills: [],
  budget: { type: 'fixed', min: '', max: '' },
  experienceLevel: 'intermediate',
  duration: 'medium',
};

export default function PostJob() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const create = useCreateJob();
  const update = useUpdateJob();
  const { data: existing, isLoading } = useJob(id, { enabled: isEdit });

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || '',
        description: existing.description || '',
        category: existing.category || '',
        skills: existing.skills || [],
        budget: {
          type: existing.budget?.type || 'fixed',
          min: existing.budget?.min ?? '',
          max: existing.budget?.max ?? '',
        },
        experienceLevel: existing.experienceLevel || 'intermediate',
        duration: existing.duration || 'medium',
      });
    }
  }, [existing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setBudget = (k, v) => setForm((f) => ({ ...f, budget: { ...f.budget, [k]: v } }));

  const validate = () => {
    const e = {};
    if (form.title.trim().length < 3) e.title = 'Title must be at least 3 characters';
    if (form.description.trim().length < 20) e.description = 'Describe the job in at least 20 characters';
    if (!form.category) e.category = 'Pick a category';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = (status) => ({
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category,
    skills: form.skills,
    budget: {
      type: form.budget.type,
      min: Number(form.budget.min) || 0,
      max: Number(form.budget.max) || 0,
    },
    experienceLevel: form.experienceLevel,
    duration: form.duration,
    ...(status ? { status } : {}),
  });

  const submit = (status) => (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = buildPayload(status);
    if (isEdit) {
      update.mutate({ id, ...payload }, {
        onSuccess: (job) => { toast.success('Job updated'); navigate(`/jobs/${job._id || job.id}`); },
        onError: (err) => toast.error(apiErrorMessage(err)),
      });
    } else {
      create.mutate(payload, {
        onSuccess: (job) => { toast.success(status === 'draft' ? 'Draft saved' : 'Job posted'); navigate(`/jobs/${job._id || job.id}`); },
        onError: (err) => toast.error(apiErrorMessage(err)),
      });
    }
  };

  const busy = create.isPending || update.isPending;

  if (isEdit && isLoading) {
    return <div className="mx-auto max-w-2xl px-4 py-8 space-y-4"><Skeleton className="h-10" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/dashboard/jobs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="h-4 w-4" /> My jobs
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">{isEdit ? 'Edit job' : 'Post a job'}</h1>
      <p className="mt-1 text-slate-500">Describe your project to attract the right freelancers.</p>

      <form onSubmit={submit(isEdit ? undefined : 'open')} className="mt-6 space-y-5">
        <Input
          label="Job title"
          name="title"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
          placeholder="e.g. Senior React developer for analytics dashboard"
          maxLength={150}
        />

        <Textarea
          label="Description"
          name="description"
          rows={8}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          error={errors.description}
          hint="Include scope, deliverables, and any required experience."
          placeholder="Describe the work, goals, and expectations…"
          maxLength={10000}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Category"
            name="category"
            placeholder="Select a category"
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            error={errors.category}
          />
          <Select
            label="Experience level"
            name="experienceLevel"
            options={EXPERIENCE_LEVEL_OPTIONS}
            value={form.experienceLevel}
            onChange={(e) => set('experienceLevel', e.target.value)}
          />
        </div>

        <TagInput
          label="Skills"
          value={form.skills}
          onChange={(v) => set('skills', v)}
          max={20}
          hint="Add up to 20 skills. Press Enter to add."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Budget type"
            name="budgetType"
            options={BUDGET_TYPE_OPTIONS}
            value={form.budget.type}
            onChange={(e) => setBudget('type', e.target.value)}
          />
          <Input
            label={form.budget.type === 'hourly' ? 'Min $/hr' : 'Min budget $'}
            name="budgetMin"
            type="number"
            min="0"
            value={form.budget.min}
            onChange={(e) => setBudget('min', e.target.value)}
          />
          <Input
            label={form.budget.type === 'hourly' ? 'Max $/hr' : 'Max budget $'}
            name="budgetMax"
            type="number"
            min="0"
            value={form.budget.max}
            onChange={(e) => setBudget('max', e.target.value)}
          />
        </div>

        <Select
          label="Project duration"
          name="duration"
          options={JOB_DURATION_OPTIONS}
          value={form.duration}
          onChange={(e) => set('duration', e.target.value)}
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" loading={busy}>{isEdit ? 'Save changes' : 'Post job'}</Button>
          {!isEdit && (
            <Button type="button" variant="secondary" onClick={submit('draft')} loading={busy}>
              Save as draft
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
