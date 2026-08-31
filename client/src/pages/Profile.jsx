import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, Briefcase, Award, FolderGit2, Save, Eye, Globe, Lock } from 'lucide-react';
import { useMyProfile, useUpdateProfile } from '../services/profile.js';
import { apiErrorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CATEGORIES, AVAILABILITY_OPTIONS, PROFICIENCY_OPTIONS } from '../constants/index.js';
import { Input } from '../components/Input.jsx';
import { Textarea } from '../components/Textarea.jsx';
import { Select } from '../components/Select.jsx';
import { Button } from '../components/Button.jsx';
import { TagInput } from '../components/TagInput.jsx';
import { RepeatableList } from '../components/RepeatableList.jsx';
import { AvatarUpload } from '../components/AvatarUpload.jsx';
import { CvUpload } from '../components/CvUpload.jsx';
import { ProfileCompletion } from '../components/ProfileCompletion.jsx';
import { Skeleton } from '../components/Loaders.jsx';
import { dateRange } from '../utils/format.js';

const BLANK = {
  title: '', category: '', overview: '', hourlyRate: '', availability: 'not_available',
  skills: [], languages: [], location: { country: '', city: '', timezone: '' },
  links: { website: '', linkedin: '', github: '' },
  education: [], experience: [], certifications: [], portfolio: [], visibility: 'private',
};

export default function Profile() {
  const { user } = useAuth();
  const uid = user?._id || user?.id;
  const { data: profile, isLoading } = useMyProfile();
  const update = useUpdateProfile();
  const [form, setForm] = useState(BLANK);

  useEffect(() => {
    if (profile) setForm({ ...BLANK, ...profile, location: { ...BLANK.location, ...profile.location }, links: { ...BLANK.links, ...profile.links } });
  }, [profile]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setNested = (group, k, v) => setForm((f) => ({ ...f, [group]: { ...f[group], [k]: v } }));

  const onSave = async () => {
    try {
      const payload = { ...form, hourlyRate: Number(form.hourlyRate) || 0 };
      await update.mutateAsync(payload);
      toast.success('Profile saved');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save profile'));
    }
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;

  return (
    <div className="max-w-3xl pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <AvatarUpload />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-slate-900">{user?.name}</h1>
          <p className="truncate text-sm text-slate-500">{form.title || 'Add a professional headline'}</p>
          <ProfileCompletion value={profile?.completeness || 0} className="mt-3 max-w-xs" />
        </div>
        <div className="flex flex-col gap-2">
          {uid && (
            <Link to={`/freelancers/${uid}`}>
              <Button variant="secondary" size="sm" className="w-full"><Eye className="h-4 w-4" /> View public</Button>
            </Link>
          )}
          <Button size="sm" onClick={onSave} loading={update.isPending}><Save className="h-4 w-4" /> Save changes</Button>
        </div>
      </div>

      {/* Basics */}
      <section className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">Basics</h2>
        <Input label="Professional headline" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Senior React & Node Engineer" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Category" placeholder="Select a category" options={CATEGORIES.map((c) => ({ value: c, label: c }))} value={form.category} onChange={(e) => set('category', e.target.value)} />
          <Input label="Hourly rate (USD)" type="number" min="0" value={form.hourlyRate} onChange={(e) => set('hourlyRate', e.target.value)} placeholder="e.g. 65" />
        </div>
        <Select label="Availability" options={AVAILABILITY_OPTIONS} value={form.availability} onChange={(e) => set('availability', e.target.value)} />
        <Textarea label="Overview" rows={5} value={form.overview} onChange={(e) => set('overview', e.target.value)} placeholder="Summarize your experience, strengths, and what you offer clients." hint={`${(form.overview || '').length}/5000`} />
        <TagInput label="Skills" value={form.skills} onChange={(v) => set('skills', v)} placeholder="Add a skill and press Enter" hint="Add at least 3 (max 30)." />
      </section>

      {/* Location & links */}
      <section className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900">Location & links</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Country" value={form.location.country} onChange={(e) => setNested('location', 'country', e.target.value)} />
          <Input label="City" value={form.location.city} onChange={(e) => setNested('location', 'city', e.target.value)} />
          <Input label="Timezone" value={form.location.timezone} onChange={(e) => setNested('location', 'timezone', e.target.value)} placeholder="e.g. GMT+1" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Website" value={form.links.website} onChange={(e) => setNested('links', 'website', e.target.value)} placeholder="https://" />
          <Input label="LinkedIn" value={form.links.linkedin} onChange={(e) => setNested('links', 'linkedin', e.target.value)} placeholder="https://" />
          <Input label="GitHub" value={form.links.github} onChange={(e) => setNested('links', 'github', e.target.value)} placeholder="https://" />
        </div>
      </section>

      {/* Languages */}
      <div className="mt-6">
        <RepeatableList
          title="Languages"
          fields={[
            { name: 'name', label: 'Language', placeholder: 'e.g. English' },
            { name: 'proficiency', label: 'Proficiency', type: 'select', options: PROFICIENCY_OPTIONS },
          ]}
          value={form.languages}
          onChange={(v) => set('languages', v)}
          addLabel="Add language"
          emptyText="Add the languages you work in."
          renderSummary={(l) => (
            <span className="text-slate-800"><b>{l.name}</b> · <span className="capitalize text-slate-500">{l.proficiency}</span></span>
          )}
        />
      </div>

      {/* Experience */}
      <div className="mt-6">
        <RepeatableList
          title="Work experience" icon={Briefcase}
          fields={[
            { name: 'title', label: 'Title' },
            { name: 'company', label: 'Company' },
            { name: 'location', label: 'Location', colSpan: 2 },
            { name: 'startDate', label: 'Start date', type: 'date' },
            { name: 'endDate', label: 'End date', type: 'date' },
            { name: 'current', label: 'I currently work here', type: 'checkbox' },
            { name: 'description', label: 'Description', type: 'textarea' },
          ]}
          value={form.experience}
          onChange={(v) => set('experience', v)}
          addLabel="Add experience"
          emptyText="Add your relevant work history."
          renderSummary={(x) => (
            <div>
              <div className="font-medium text-slate-900">{x.title} · {x.company}</div>
              <div className="text-xs text-slate-500">{dateRange(x.startDate, x.endDate, x.current)}</div>
              {x.description && <p className="mt-1 line-clamp-2 text-slate-600">{x.description}</p>}
            </div>
          )}
        />
      </div>

      {/* Education */}
      <div className="mt-6">
        <RepeatableList
          title="Education" icon={GraduationCap}
          fields={[
            { name: 'school', label: 'School', colSpan: 2 },
            { name: 'degree', label: 'Degree' },
            { name: 'field', label: 'Field of study' },
            { name: 'startYear', label: 'Start year', type: 'number' },
            { name: 'endYear', label: 'End year', type: 'number' },
          ]}
          value={form.education}
          onChange={(v) => set('education', v)}
          addLabel="Add education"
          renderSummary={(e) => (
            <div>
              <div className="font-medium text-slate-900">{e.school}</div>
              <div className="text-xs text-slate-500">{[e.degree, e.field].filter(Boolean).join(', ')} {e.startYear || e.endYear ? `· ${[e.startYear, e.endYear].filter(Boolean).join(' – ')}` : ''}</div>
            </div>
          )}
        />
      </div>

      {/* Certifications */}
      <div className="mt-6">
        <RepeatableList
          title="Certifications" icon={Award}
          fields={[
            { name: 'name', label: 'Certification', colSpan: 2 },
            { name: 'issuer', label: 'Issuer' },
            { name: 'year', label: 'Year', type: 'number' },
            { name: 'url', label: 'Credential URL', colSpan: 2 },
          ]}
          value={form.certifications}
          onChange={(v) => set('certifications', v)}
          addLabel="Add certification"
          renderSummary={(c) => (
            <div>
              <div className="font-medium text-slate-900">{c.name}</div>
              <div className="text-xs text-slate-500">{[c.issuer, c.year].filter(Boolean).join(' · ')}</div>
            </div>
          )}
        />
      </div>

      {/* Portfolio */}
      <div className="mt-6">
        <RepeatableList
          title="Portfolio" icon={FolderGit2}
          fields={[
            { name: 'title', label: 'Project title', colSpan: 2 },
            { name: 'url', label: 'Project URL' },
            { name: 'image', label: 'Image URL' },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'tags', label: 'Tags', type: 'tags' },
          ]}
          value={form.portfolio}
          onChange={(v) => set('portfolio', v)}
          addLabel="Add project"
          renderSummary={(p) => (
            <div>
              <div className="font-medium text-slate-900">{p.title}</div>
              {p.description && <p className="mt-1 line-clamp-2 text-slate-600">{p.description}</p>}
            </div>
          )}
        />
      </div>

      {/* CV + visibility */}
      <div className="mt-6"><CvUpload cv={profile?.cv} /></div>

      <section className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          {form.visibility === 'public' ? <Globe className="h-5 w-5 text-emerald-600" /> : <Lock className="h-5 w-5 text-slate-400" />}
          <div>
            <h2 className="font-semibold text-slate-900">Profile visibility</h2>
            <p className="text-sm text-slate-500">{form.visibility === 'public' ? 'Your profile appears in the talent directory.' : 'Only you can see your profile.'}</p>
          </div>
        </div>
        <Select
          className="w-40"
          options={[{ value: 'public', label: 'Public' }, { value: 'private', label: 'Private' }]}
          value={form.visibility}
          onChange={(e) => set('visibility', e.target.value)}
        />
      </section>

      <div className="mt-6 flex justify-end">
        <Button onClick={onSave} loading={update.isPending}><Save className="h-4 w-4" /> Save changes</Button>
      </div>
    </div>
  );
}
