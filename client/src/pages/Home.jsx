import { Link } from 'react-router-dom';
import { Search, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Button } from '../components/Button.jsx';

const categories = ['Web Development', 'AI / Machine Learning', 'UI/UX Design', 'Mobile Development', 'DevOps', 'Content Writing', 'Digital Marketing', 'Data Science'];
const stats = [['12k+', 'Verified freelancers'], ['8k+', 'Jobs posted'], ['96%', 'Client satisfaction'], ['$4M+', 'Paid to talent']];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
            <Sparkles className="h-3.5 w-3.5" /> AI-powered hiring
          </span>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Hire verified freelance talent, matched by AI
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            TalentHive connects clients with vetted professionals. AI analyzes profiles and jobs so the
            right match happens faster — with verification you can trust.
          </p>
          <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <Search className="ml-2 h-5 w-5 text-slate-400" />
            <input
              className="flex-1 border-0 px-2 py-2 text-sm focus:outline-none focus:ring-0"
              placeholder="Try 'React developer' or 'logo design'"
              aria-label="Search talent or jobs"
            />
            <Link to="/find-talent"><Button>Search</Button></Link>
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <Link to="/register"><Button variant="primary" size="lg">Get started</Button></Link>
            <Link to="/find-jobs"><Button variant="secondary" size="lg">Browse jobs</Button></Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {stats.map(([n, label]) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-brand-700">{n}</div>
              <div className="mt-1 text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900">Popular categories</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((c) => (
            <Link key={c} to="/find-talent" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow">
              <span className="font-medium text-slate-800">{c}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Value props */}
      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 md:grid-cols-3">
          {[
            [ShieldCheck, 'Verified talent', 'Multi-step verification — email, CV analysis, identity, and skill badges.'],
            [Sparkles, 'AI matching', 'Describe your project and get a ranked shortlist with match explanations.'],
            [Star, 'Trusted reviews', 'Transparent reputation scores from completed contracts.'],
          ].map(([Icon, title, desc]) => (
            <div key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <Icon className="h-8 w-8 text-brand-600" />
              <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-900">Ready to build your team?</h2>
        <p className="mt-2 text-slate-600">Join thousands of clients and freelancers on TalentHive.</p>
        <Link to="/register" className="mt-6 inline-block"><Button size="lg">Create your free account</Button></Link>
      </section>
    </div>
  );
}
