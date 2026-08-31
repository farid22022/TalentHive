import { Link } from 'react-router-dom';

const groups = [
  { title: 'For Clients', links: [['Find Talent', '/find-talent'], ['Post a Job', '/register'], ['How It Works', '/how-it-works']] },
  { title: 'For Freelancers', links: [['Find Jobs', '/find-jobs'], ['Create Profile', '/register'], ['Services', '/services']] },
  { title: 'Company', links: [['About', '/about'], ['Pricing', '/pricing'], ['Contact', '/contact']] },
  { title: 'Resources', links: [['Help Center', '/help'], ['Terms', '/terms'], ['Privacy', '/privacy']] },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        {groups.map((g) => (
          <div key={g.title}>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">{g.title}</h3>
            <ul className="space-y-2">
              {g.links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-slate-500 hover:text-brand-700">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} TalentHive. An original demo marketplace platform.
      </div>
    </footer>
  );
}
