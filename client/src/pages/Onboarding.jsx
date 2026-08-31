import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { basicsSchema, skillsSchema, detailsSchema } from '../validators/profile.schemas.js';
import { useCompleteOnboarding } from '../services/profile.js';
import { apiErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CATEGORIES, AVAILABILITY_OPTIONS, PROFICIENCY_OPTIONS } from '../constants/index.js';
import { Input } from '../components/Input.jsx';
import { Textarea } from '../components/Textarea.jsx';
import { Select } from '../components/Select.jsx';
import { Button } from '../components/Button.jsx';
import { TagInput } from '../components/TagInput.jsx';
import { RepeatableList } from '../components/RepeatableList.jsx';

const STEPS = ['Basics', 'Skills & rate', 'Details'];

const INITIAL = {
  title: '', category: '', overview: '',
  skills: [], hourlyRate: '', availability: 'full_time',
  location: { country: '', city: '', timezone: '' },
  languages: [{ name: 'English', proficiency: 'fluent' }],
  links: { website: '', linkedin: '', github: '' },
};

const SCHEMAS = [basicsSchema, skillsSchema, detailsSchema];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const complete = useCompleteOnboarding();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setNested = (g, k, v) => setForm((f) => ({ ...f, [g]: { ...f[g], [k]: v } }));

  // Clients don't have a freelancer onboarding in this phase.
  if (user && user.role === 'client' && !(user.roles || []).includes('freelancer')) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900">You're all set</h1>
        <p className="mt-2 text-slate-500">Client onboarding and job posting arrive in Phase 5.</p>
        <Button className="mt-6" onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
      </div>
    );
  }

  const validateStep = () => {
    const res = SCHEMAS[step].safeParse(form);
    if (res.success) {
      setErrors({});
      return true;
    }
    const map = {};
    for (const issue of res.error.issues) map[issue.path.join('.')] = issue.message;
    setErrors(map);
    return false;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    if (!validateStep()) return;
    try {
      await complete.mutateAsync({ ...form, hourlyRate: Number(form.hourlyRate) || 0 });
      toast.success('Profile published!');
      navigate('/dashboard/profile');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not complete onboarding'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-2 flex items-center gap-2 text-brand-700">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">Set up your freelancer profile</span>
        </div>

        {/* Stepper */}
        <ol className="mb-8 flex items-center gap-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-500' : 'bg-slate-200 text-slate-500'}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={`hidden text-sm sm:block ${i === step ? 'font-medium text-slate-900' : 'text-slate-500'}`}>{label}</span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
            </li>
          ))}
        </ol>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {step === 0 && (
            <div className="space-y-4">
              <Input label="Professional headline" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Senior React & Node Engineer" error={errors.title} />
              <Select label="Category" placeholder="Select a category" options={CATEGORIES.map((c) => ({ value: c, label: c }))} value={form.category} onChange={(e) => set('category', e.target.value)} error={errors.category} />
              <Textarea label="Overview" rows={6} value={form.overview} onChange={(e) => set('overview', e.target.value)} placeholder="Summarize your experience and what you offer clients." error={errors.overview} hint={`${form.overview.length}/5000 (min 50)`} />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <TagInput label="Skills" value={form.skills} onChange={(v) => set('skills', v)} placeholder="Add a skill and press Enter" error={errors.skills} hint="Add at least 3." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Hourly rate (USD)" type="number" min="0" value={form.hourlyRate} onChange={(e) => set('hourlyRate', e.target.value)} placeholder="e.g. 65" error={errors.hourlyRate} />
                <Select label="Availability" options={AVAILABILITY_OPTIONS} value={form.availability} onChange={(e) => set('availability', e.target.value)} error={errors.availability} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Country" value={form.location.country} onChange={(e) => setNested('location', 'country', e.target.value)} error={errors['location.country']} />
                <Input label="City" value={form.location.city} onChange={(e) => setNested('location', 'city', e.target.value)} />
                <Input label="Timezone" value={form.location.timezone} onChange={(e) => setNested('location', 'timezone', e.target.value)} placeholder="GMT+1" />
              </div>
              <RepeatableList
                title="Languages"
                fields={[
                  { name: 'name', label: 'Language', placeholder: 'e.g. English' },
                  { name: 'proficiency', label: 'Proficiency', type: 'select', options: PROFICIENCY_OPTIONS },
                ]}
                value={form.languages}
                onChange={(v) => set('languages', v)}
                addLabel="Add language"
                renderSummary={(l) => <span className="text-slate-800"><b>{l.name}</b> · <span className="capitalize text-slate-500">{l.proficiency}</span></span>}
              />
              {errors.languages && <p className="text-xs text-red-600">{errors.languages}</p>}
            </div>
          )}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 0}><ArrowLeft className="h-4 w-4" /> Back</Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>Continue <ArrowRight className="h-4 w-4" /></Button>
            ) : (
              <Button onClick={finish} loading={complete.isPending}>Publish profile <Check className="h-4 w-4" /></Button>
            )}
          </div>
        </div>

        <button onClick={() => navigate('/dashboard')} className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-600">
          Skip for now
        </button>
      </div>
    </div>
  );
}
