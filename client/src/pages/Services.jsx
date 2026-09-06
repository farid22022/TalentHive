import { Link } from 'react-router-dom';
import { ArrowRight, Brush, Code2, Megaphone, PenLine, Sparkles, Workflow } from 'lucide-react';
import { Button } from '../components/Button.jsx';

const categories = [
  { icon: Code2, title: 'Development & IT', text: 'Websites, apps, automations, and reliable technical builds.', tone: 'bg-cyan-50 text-cyan-700' },
  { icon: Brush, title: 'Design & Creative', text: 'Brand identities, product design, illustrations, and visual systems.', tone: 'bg-amber-50 text-amber-700' },
  { icon: PenLine, title: 'Writing & Translation', text: 'Clear copy, content strategy, localization, and editorial support.', tone: 'bg-rose-50 text-rose-700' },
  { icon: Megaphone, title: 'Sales & Marketing', text: 'Campaigns, SEO, social content, and growth expertise on demand.', tone: 'bg-emerald-50 text-emerald-700' },
];

const examples = [
  ['Build a responsive landing page', 'From $250', '3 days'],
  ['Design a polished brand starter kit', 'From $180', '5 days'],
  ['Write a conversion-focused website', 'From $120', '4 days'],
];

export default function Services() {
  return (
    <div className="overflow-hidden">
      <section className="relative bg-slate-950 text-white">
        <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:py-28">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-cyan-100"><Sparkles className="h-4 w-4" /> Project Catalog is coming to life</div>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">Buy expertise in a package that fits.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Browse focused freelance services with clear scope, upfront pricing, and delivery timelines. Find the right starting point, then make it yours.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link to="/find-talent"><Button size="lg">Explore talent <ArrowRight className="h-4 w-4" /></Button></Link><Link to="/how-it-works"><Button variant="secondary" size="lg" className="border-white/20 bg-white/10 text-white hover:bg-white/20">See how it works</Button></Link></div>
          </div>
          <div className="relative mx-auto w-full max-w-md rotate-1 rounded-3xl border border-white/15 bg-white p-3 text-slate-900 shadow-2xl shadow-cyan-950/40">
            <div className="rounded-2xl bg-slate-100 p-5"><div className="flex items-center justify-between"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">TOP SERVICE</span><span className="text-sm text-slate-500">5.0 ★</span></div><div className="mt-8 h-28 rounded-xl bg-gradient-to-br from-cyan-400 via-brand-500 to-slate-900" /><h2 className="mt-5 text-xl font-bold">Launch-ready React landing page</h2><p className="mt-2 text-sm text-slate-500">A focused page designed, built, and optimized for your next launch.</p><div className="mt-5 flex items-end justify-between border-t border-slate-200 pt-4"><div><p className="text-xs text-slate-500">Starting at</p><p className="text-2xl font-bold">$250</p></div><span className="text-sm text-slate-500">3 day delivery</span></div></div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Browse by need</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">A better way to start the work.</h2><p className="mt-4 text-slate-600">Services are designed around outcomes, so you can compare options without turning every project into a blank page.</p></div><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories.map(({ icon: Icon, title, text, tone }) => <Link key={title} to="/find-talent" className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><div className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}><Icon className="h-6 w-6" /></div><h3 className="mt-6 font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>)}</div></section>
      <section className="bg-white"><div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><div className="flex flex-wrap items-end justify-between gap-6"><div><p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">What you can buy</p><h2 className="mt-3 text-3xl font-bold text-slate-900">Clear deliverables. No guesswork.</h2></div><Link to="/find-talent" className="text-sm font-bold text-brand-600">Find a specialist <ArrowRight className="ml-1 inline h-4 w-4" /></Link></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{examples.map(([title, price, time], i) => <div key={title} className="rounded-2xl border border-slate-200 p-6"><div className="flex items-center gap-2 text-sm font-semibold text-slate-400"><Workflow className="h-4 w-4" /> Package {String(i + 1).padStart(2, '0')}</div><h3 className="mt-8 text-xl font-bold text-slate-900">{title}</h3><div className="mt-8 flex justify-between border-t border-slate-100 pt-4 text-sm"><span className="font-semibold text-slate-900">{price}</span><span className="text-slate-500">{time} delivery</span></div></div>)}</div></div></section>
      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8"><h2 className="text-3xl font-bold text-slate-900">Need something more custom?</h2><p className="mx-auto mt-3 max-w-xl text-slate-500">Post a brief and let skilled freelancers come to you with a tailored proposal.</p><Link to="/dashboard/jobs/new" className="mt-7 inline-block"><Button size="lg">Post a job <ArrowRight className="h-4 w-4" /></Button></Link></section>
    </div>
  );
}
