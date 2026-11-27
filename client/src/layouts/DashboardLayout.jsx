/**
 * Dashboard shell in a Google Workspace style (Gmail / Drive / Admin console):
 * soft surface background, sidebar with a "New" button and tonal pill navigation,
 * a wide pill search bar, and the page content in one large white rounded pane.
 */
import { Suspense, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Search, X, ExternalLink, KeyRound, Plus, HelpCircle, Settings as Cog, Briefcase, UserPlus, Globe } from 'lucide-react';
import { LogoImage } from '../components/brand/Logo';
import Seo from '../components/seo/Seo';
import { PageLoader } from '../components/ui/Feedback';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useVisibleNav } from './dashboardNav';
import { RealtimeProvider, useRealtime } from '../context/RealtimeContext';
import { PERMISSIONS as P } from '../lib/constants';
import { cx, initials } from '../lib/format';

/* ------------------------------ "New" menu ------------------------------ */

function NewButton({ collapsed }) {
  const { can, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = [
    can(P.ROLES_MANAGE) && { label: 'Recruitment role', icon: Briefcase, to: '/admin/roles?new=1' },
    isSuperAdmin && { label: 'Admin user', icon: UserPlus, to: '/admin/admins?new=1' },
    { label: 'Open public website', icon: Globe, href: '/' },
  ].filter(Boolean);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cx(
          'flex h-14 items-center gap-3 rounded-2xl bg-white text-[14px] font-medium text-navy-900 shadow-[0_1px_3px_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)] transition hover:bg-brand-50 hover:shadow-[0_1px_3px_rgba(60,64,67,.3),0_6px_10px_4px_rgba(60,64,67,.15)]',
          collapsed ? 'w-14 justify-center' : 'px-5 pr-6'
        )}
      >
        <Plus className="h-6 w-6 text-brand-600" aria-hidden />
        {!collapsed && 'New'}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div role="menu" className="absolute left-0 z-50 mt-2 w-64 animate-scale-in rounded-2xl bg-white py-2 shadow-[0_2px_6px_2px_rgba(60,64,67,.15),0_1px_2px_rgba(60,64,67,.3)]">
            {items.map(({ label, icon: Icon, to, href }) => (
              <button
                key={label}
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (href) window.open(href, '_blank', 'noopener');
                  else navigate(to);
                }}
                className="flex w-full items-center gap-4 px-5 py-2.5 text-left text-sm text-navy-800 hover:bg-[#f1f3f4]"
              >
                <Icon className="h-5 w-5 text-navy-500" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------- sidebar -------------------------------- */

function Sidebar({ onNavigate, collapsed }) {
  const nav = useVisibleNav();
  return (
    <div className="flex h-full flex-col">
      <div className={cx('pb-4 pt-2', collapsed ? 'px-3' : 'px-4')}>
        <NewButton collapsed={collapsed} />
      </div>
      <nav className="flex-1 overflow-y-auto pb-4 pr-3" aria-label="Dashboard navigation">
        {nav.map((g, gi) => (
          <div key={g.group} className={cx(gi > 0 && 'mt-4 border-t border-[#e3e6ea] pt-4')}>
            {!collapsed && <p className="px-6 pb-1 text-[11px] font-medium uppercase tracking-[.08em] text-navy-400">{g.group}</p>}
            <ul>
              {g.items.map(({ to, end, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={onNavigate}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) =>
                      cx(
                        'flex h-10 items-center gap-4 rounded-r-full text-[14px] transition-colors',
                        collapsed ? 'ml-3 w-12 justify-center rounded-full' : 'pl-6 pr-4',
                        isActive ? 'bg-brand-100 font-bold text-navy-950' : 'font-medium text-navy-700 hover:bg-[#e8eaed]'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={cx('h-5 w-5 shrink-0', isActive ? 'text-brand-700' : 'text-navy-500')} strokeWidth={isActive ? 2.3 : 1.9} aria-hidden />
                        {!collapsed && <span className="truncate">{label}</span>}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {!collapsed && (
        <a href="/" target="_blank" rel="noreferrer" className="mx-4 mb-4 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[13px] text-navy-600 hover:bg-[#e8eaed]">
          <ExternalLink className="h-4 w-4" aria-hidden /> View public website
        </a>
      )}
    </div>
  );
}

/* ------------------------------ search bar ------------------------------ */

function TopSearch() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [q, setQ] = useState('');
  const ref = useRef(null);
  const allowed = can(P.CANDIDATES_VIEW);

  // keep the box in sync when viewing a candidate search
  useEffect(() => {
    setQ(pathname === '/admin/candidates' ? new URLSearchParams(search).get('search') || '' : '');
  }, [pathname, search]);

  // "/" focuses search, like Gmail
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!allowed) return <div className="flex-1" />;

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/admin/candidates?search=${encodeURIComponent(term)}` : '/admin/candidates');
  };

  return (
    <form onSubmit={submit} role="search" className="max-w-[720px] flex-1">
      <div className="group flex h-12 items-center gap-2 rounded-full bg-[#e9eef6] px-2 ring-brand-400 transition focus-within:bg-white focus-within:shadow-[0_1px_1px_rgba(65,69,73,.3),0_1px_3px_1px_rgba(65,69,73,.15)] has-[input:focus-visible]:ring-2">
        <button type="submit" className="flex h-10 w-10 items-center justify-center rounded-full text-navy-600 hover:bg-black/5" aria-label="Search">
          <Search className="h-5 w-5" />
        </button>
        <input
          ref={ref}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search candidates by name, email or mobile"
          aria-label="Search candidates"
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-navy-900 placeholder:text-navy-500 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        {q && (
          <button type="button" onClick={() => { setQ(''); ref.current?.focus(); }} className="flex h-10 w-10 items-center justify-center rounded-full text-navy-600 hover:bg-black/5" aria-label="Clear search">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </form>
  );
}

/* ---------------------------- live indicator ---------------------------- */

function LiveIndicator() {
  const { status } = useRealtime();
  const live = status === 'live';
  const label = live ? 'Live' : status === 'connecting' ? 'Connecting…' : status === 'offline' ? 'Offline' : 'Reconnecting…';
  return (
    <span
      className={cx('hidden h-8 items-center gap-2 rounded-full px-3 text-[12px] font-medium sm:inline-flex', live ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#fef7e0] text-[#b06000]')}
      title={live ? 'Dashboard updates automatically' : 'Live updates paused – trying to reconnect'}
      role="status"
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        {live && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-[#1e8e3e]" />}
        <span className={cx('relative h-2 w-2 rounded-full', live ? 'bg-[#1e8e3e]' : 'bg-[#f29900]')} />
      </span>
      {label}
    </span>
  );
}

/* ------------------------------- account ------------------------------- */

function AccountMenu() {
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
        className="flex h-10 w-10 items-center justify-center rounded-full p-1 hover:bg-black/5"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${user.name}`}
        title={`${user.name}\n${user.email}`}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-[13px] font-medium text-white">{initials(user.name)}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div role="menu" className="absolute right-0 z-50 mt-2 w-[340px] animate-scale-in rounded-[28px] bg-[#e9eef6] p-2 shadow-[0_2px_6px_2px_rgba(60,64,67,.15),0_1px_2px_rgba(60,64,67,.3)]">
            <p className="px-4 pb-3 pt-2 text-center text-sm font-medium text-navy-700">{user.email}</p>
            <div className="rounded-3xl bg-white px-5 py-5 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-medium text-white">{initials(user.name)}</span>
              <p className="mt-3 text-xl text-navy-900">Hi, {user.name.split(' ')[0]}!</p>
              <p className="mt-0.5 text-sm text-navy-500">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
              <button
                role="menuitem"
                type="button"
                onClick={() => { setOpen(false); navigate('/admin/account'); }}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-navy-300 px-5 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                <KeyRound className="h-4 w-4" aria-hidden /> Manage your account
              </button>
            </div>
            <button role="menuitem" type="button" onClick={signOut} className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-full bg-white py-3 text-sm font-medium text-navy-800 hover:bg-[#f1f3f4]">
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------- layout -------------------------------- */

function DashboardShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('h369_nav_collapsed') === '1');
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => setMobileOpen(false), [pathname]);

  const toggleNav = () => {
    if (window.innerWidth < 1024) {
      setMobileOpen(true);
      return;
    }
    setCollapsed((c) => {
      localStorage.setItem('h369_nav_collapsed', c ? '0' : '1');
      return !c;
    });
  };

  return (
    <div className="gdash min-h-screen bg-[#f8fafd]">
      <Seo title="Dashboard | Hospitality369" noindex />

      {/* ---------- top app bar ---------- */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-2 bg-[#f8fafd] px-2 sm:gap-4 sm:px-4">
        <div className={cx('flex shrink-0 items-center gap-1', collapsed ? 'lg:w-[72px]' : 'lg:w-[240px]')}>
          <button type="button" onClick={toggleNav} className="flex h-12 w-12 items-center justify-center rounded-full text-navy-700 hover:bg-black/5" aria-label="Main menu">
            <Menu className="h-6 w-6" />
          </button>
          {!collapsed && (
            <NavLink to="/admin" className="hidden items-center sm:flex" aria-label="Hospitality369 dashboard">
              <LogoImage className="h-8" />
            </NavLink>
          )}
        </div>
        <TopSearch />
        <div className="ml-auto flex items-center gap-1">
          <LiveIndicator />
          <a href="mailto:?subject=Hospitality369 dashboard help" className="hidden h-10 w-10 items-center justify-center rounded-full text-navy-600 hover:bg-black/5 sm:flex" aria-label="Help" title="Help">
            <HelpCircle className="h-5 w-5" />
          </a>
          {isSuperAdmin && (
            <button type="button" onClick={() => navigate('/admin/settings')} className="hidden h-10 w-10 items-center justify-center rounded-full text-navy-600 hover:bg-black/5 sm:flex" aria-label="Settings" title="Settings">
              <Cog className="h-5 w-5" />
            </button>
          )}
          <AccountMenu />
        </div>
      </header>

      {/* ---------- sidebar (desktop) ---------- */}
      <aside className={cx('fixed bottom-0 left-0 top-16 z-20 hidden transition-[width] duration-200 lg:block', collapsed ? 'w-[80px]' : 'w-[256px]')}>
        <Sidebar collapsed={collapsed} />
      </aside>

      {/* ---------- sidebar (mobile drawer) ---------- */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 w-[290px] animate-fade-up rounded-r-2xl bg-[#f8fafd] pt-3 shadow-2xl">
            <div className="mb-3 flex items-center justify-between px-4">
              <LogoImage className="h-8" />
              <button type="button" onClick={() => setMobileOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-navy-600 hover:bg-black/5" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* ---------- content pane ---------- */}
      <main className={cx('pb-4 pr-2 transition-[padding] duration-200 sm:pr-4', collapsed ? 'pl-2 lg:pl-[80px]' : 'pl-2 lg:pl-[256px]')}>
        <div className="min-h-[calc(100vh-80px)] rounded-2xl bg-white px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-[1400px]">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <RealtimeProvider>
      <DashboardShell />
    </RealtimeProvider>
  );
}
