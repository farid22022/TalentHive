import { Outlet, NavLink, Link } from 'react-router-dom';
import { Briefcase, LayoutDashboard, User, MessageSquare, Settings, Sparkles, ShieldCheck, Bookmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const items = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
  { to: '/dashboard/jobs', label: 'My Jobs', icon: Briefcase },
  { to: '/dashboard/saved-jobs', label: 'Saved Jobs', icon: Bookmark },
  { to: '/dashboard/cv-analysis', label: 'CV Analyzer', icon: Sparkles },
  { to: '/dashboard/verification', label: 'Verification', icon: ShieldCheck },
  { to: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const adminItems = [
  { to: '/dashboard/admin/verification', label: 'Review Queue', icon: ShieldCheck },
];

export function DashboardLayout() {
  const { hasRole } = useAuth();
  const nav = [...items, ...(hasRole('admin') ? adminItems : [])];
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <Link to="/" className="mb-6 flex items-center gap-2 font-bold text-brand-700">
            <Briefcase className="h-6 w-6" />
            <span>TalentHive</span>
          </Link>
          <nav className="space-y-1" aria-label="Dashboard">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
