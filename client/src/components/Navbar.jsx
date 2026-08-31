import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { NAV_LINKS } from '../constants/index.js';
import { Button } from './Button.jsx';

export function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4" aria-label="Main">
        <Link to="/" className="flex items-center gap-2 font-bold text-brand-700">
          <Briefcase className="h-6 w-6" aria-hidden="true" />
          <span className="text-lg">TalentHive</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? 'text-brand-700' : 'text-slate-600 hover:text-slate-900'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-slate-700 hover:text-brand-700">
                {user?.name?.split(' ')[0] || 'Dashboard'}
              </Link>
              <Button variant="secondary" size="sm" onClick={handleLogout}>Log out</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-brand-700">Log in</Link>
              <Link to="/register"><Button size="sm">Sign up</Button></Link>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700">
                {l.label}
              </NavLink>
            ))}
            <hr />
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium">Dashboard</Link>
                <Button variant="secondary" size="sm" onClick={handleLogout}>Log out</Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="text-sm font-medium">Log in</Link>
                <Link to="/register" onClick={() => setOpen(false)}><Button size="sm" className="w-full">Sign up</Button></Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
