import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, ExternalLink, KeyRound } from 'lucide-react';
import Logo from '../components/brand/Logo';
import Seo from '../components/seo/Seo';
import { PageLoader } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useVisibleNav } from './dashboardNav';
import { cx, initials } from '../lib/format';

function Sidebar({ onNavigate }) {
  const nav = useVisibleNav();
  return (
    <div className="flex h-full flex-col bg-navy-950 text-navy-300">
      <div className="flex h-[72px] items-center px-6">
        <Logo onDark to="/admin" />
      </div>
      <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-4" aria-label="Dashboard navigation">
        {nav.map((g) => (
          <div key={g.group}>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[.18em] text-navy-500">{g.group}</p>
            <ul className="space-y-0.5">
              {g.items.map(({ to, end, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cx(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition',
                        isActive ? 'bg-white/[.07] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]' : 'hover:bg-white/[.04] hover:text-white'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={cx('h-[18px] w-[18px] transition', isActive ? 'text-brand-300' : 'text-navy-500 group-hover:text-navy-300')} aria-hidden />
                        {label}
                        {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden />}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="m-3 rounded-2xl border border-white/5 bg-gradient-to-br from-white/[.06] to-transparent p-4">
        <p className="text-[13px] font-semibold text-white">Public website</p>
        <p className="mt-0.5 text-xs text-navy-400">See what candidates see.</p>
        <a href="/" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-300 hover:text-brand-200">
          Open site <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </div>
  );
}

function UserMenu() {
  const { user, logout, isSuperAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await logout();
    toast.success('You have been signed out securely.');
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-3 rounded-2xl py-1.5 pl-1.5 pr-3 transition hover:bg-navy-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-300 to-brand-500 text-sm font-bold text-navy-950">
          {initials(user.name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold leading-tight text-navy-900">{user.name}</span>
          <span className="block text-xs text-navy-400">{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div role="menu" className="absolute right-0 z-20 mt-2 w-60 animate-scale-in overflow-hidden rounded-2xl border border-navy-100 bg-white p-1.5 shadow-lift">
            <div className="px-3 py-2.5">
              <p className="truncate text-sm font-semibold text-navy-900">{user.name}</p>
              <p className="truncate text-xs text-navy-400">{user.email}</p>
            </div>
            <div className="my-1 h-px bg-navy-100" />
            <button role="menuitem" type="button" onClick={() => { setOpen(false); navigate('/admin/account'); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-navy-700 hover:bg-navy-50">
              <KeyRound className="h-4 w-4 text-navy-400" aria-hidden /> Account & password
            </button>
            <button role="menuitem" type="button" onClick={signOut} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-coral-600 hover:bg-coral-500/5">
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Seo title="Dashboard | Hospitality369" noindex />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-navy-950/60" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-fade-up">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-5 rounded-lg p-1.5 text-white/70 hover:text-white" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-navy-100/70 bg-[#f4f6fb]/80 px-5 backdrop-blur-xl sm:px-8">
          <button type="button" className="rounded-xl p-2 text-navy-700 hover:bg-navy-50 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <p className="hidden text-sm text-navy-400 lg:block">
            {new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </p>
          <UserMenu />
        </header>
        <main className="px-5 py-8 sm:px-8">
          <div className="mx-auto max-w-[1400px]">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
