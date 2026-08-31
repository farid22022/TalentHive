import { useParams, Link } from 'react-router-dom';
import { MapPin, Globe, Linkedin, Github, Briefcase, GraduationCap, Award, FolderGit2, ExternalLink } from 'lucide-react';
import { usePublicProfile } from '../services/profile.js';
import { fileUrl, initials, formatRate, dateRange } from '../utils/format.js';
import { AVAILABILITY_LABELS } from '../constants/index.js';
import { Skeleton } from '../components/Loaders.jsx';
import { Button } from '../components/Button.jsx';
import { VerificationBadges } from '../components/VerificationBadges.jsx';

function Section({ title, icon: Icon, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        {Icon && <Icon className="h-5 w-5 text-brand-600" />} {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function PublicProfile() {
  const { userId } = useParams();
  const { data: profile, isLoading, isError } = usePublicProfile(userId);

  if (isLoading) {
    return <div className="mx-auto max-w-4xl px-4 py-8 space-y-4"><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;
  }
  if (isError || !profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Profile not available</h1>
        <p className="mt-2 text-slate-500">This profile is private or does not exist.</p>
        <Link to="/find-talent" className="mt-6 inline-block"><Button variant="secondary">Browse talent</Button></Link>
      </div>
    );
  }

  const u = profile.user || {};
  const loc = [profile.location?.city, profile.location?.country].filter(Boolean).join(', ');
  const links = profile.links || {};

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row">
        {u.avatar ? (
          <img src={fileUrl(u.avatar)} alt={u.name} className="h-24 w-24 rounded-full object-cover ring-2 ring-white shadow" />
        ) : (
          <div className="grid h-24 w-24 place-items-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">{initials(u.name)}</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{u.name}</h1>
            <VerificationBadges badges={profile.badges} size="sm" />
          </div>
          <p className="mt-0.5 text-lg text-slate-700">{profile.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {loc && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {loc}</span>}
            {profile.category && <span>{profile.category}</span>}
            <span>{AVAILABILITY_LABELS[profile.availability] || 'Availability n/a'}</span>
          </div>
          <div className="mt-3 flex gap-3 text-slate-400">
            {links.website && <a href={links.website} target="_blank" rel="noreferrer" aria-label="Website" className="hover:text-brand-600"><Globe className="h-5 w-5" /></a>}
            {links.linkedin && <a href={links.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-brand-600"><Linkedin className="h-5 w-5" /></a>}
            {links.github && <a href={links.github} target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-brand-600"><Github className="h-5 w-5" /></a>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">{formatRate(profile.hourlyRate)}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {profile.overview && (
            <Section title="Overview"><p className="whitespace-pre-line text-sm text-slate-600">{profile.overview}</p></Section>
          )}

          {profile.experience?.length > 0 && (
            <Section title="Experience" icon={Briefcase}>
              <ul className="space-y-4">
                {profile.experience.map((x, i) => (
                  <li key={i}>
                    <div className="font-medium text-slate-900">{x.title} · {x.company}</div>
                    <div className="text-xs text-slate-500">{dateRange(x.startDate, x.endDate, x.current)}{x.location ? ` · ${x.location}` : ''}</div>
                    {x.description && <p className="mt-1 text-sm text-slate-600">{x.description}</p>}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {profile.portfolio?.length > 0 && (
            <Section title="Portfolio" icon={FolderGit2}>
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.portfolio.map((p, i) => (
                  <div key={i} className="overflow-hidden rounded-lg border border-slate-200">
                    {p.image && <img src={fileUrl(p.image)} alt={p.title} className="h-32 w-full object-cover" />}
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900">{p.title}</h3>
                        {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline"><ExternalLink className="h-4 w-4" /></a>}
                      </div>
                      {p.description && <p className="mt-1 line-clamp-3 text-sm text-slate-600">{p.description}</p>}
                      {p.tags?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {p.tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <div className="space-y-6">
          {profile.skills?.length > 0 && (
            <Section title="Skills">
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s) => <span key={s} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{s}</span>)}
              </div>
            </Section>
          )}

          {profile.languages?.length > 0 && (
            <Section title="Languages">
              <ul className="space-y-1 text-sm">
                {profile.languages.map((l, i) => (
                  <li key={i} className="flex justify-between"><span className="text-slate-800">{l.name}</span><span className="capitalize text-slate-500">{l.proficiency}</span></li>
                ))}
              </ul>
            </Section>
          )}

          {profile.education?.length > 0 && (
            <Section title="Education" icon={GraduationCap}>
              <ul className="space-y-3 text-sm">
                {profile.education.map((e, i) => (
                  <li key={i}>
                    <div className="font-medium text-slate-900">{e.school}</div>
                    <div className="text-xs text-slate-500">{[e.degree, e.field].filter(Boolean).join(', ')}</div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {profile.certifications?.length > 0 && (
            <Section title="Certifications" icon={Award}>
              <ul className="space-y-2 text-sm">
                {profile.certifications.map((c, i) => (
                  <li key={i}>
                    <div className="font-medium text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-500">{[c.issuer, c.year].filter(Boolean).join(' · ')}</div>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
