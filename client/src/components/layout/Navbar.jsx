import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Briefcase, Compass, GraduationCap, Target, Gift, Images, PhoneCall } from 'lucide-react';
import Logo from '../brand/Logo';
import Button from '../ui/Button';
import { cx } from '../../lib/format';
import { REFERRALS_ENABLED } from '../../lib/features';

export const NAV = [
  { to: '/recruiting', label: 'Recruiting', icon: Briefcase, blurb: 'Apply for hospitality roles' },
  { to: '/mentoring', label: 'Mentoring', icon: Compass, blurb: '1:1 guidance from leaders' },
  { to: '/training', label: 'Training', icon: GraduationCap, blurb: 'Job-ready practical skills' },
  { to: '/coaching', label: 'Coaching', icon: Target, blurb: 'Leadership & career coaching' },
];

/** Main menu = the four pathways + company pages (Gallery & Contact pages to be designed later) */
export const MAIN_NAV = [
  ...NAV,
  { to: '/gallery', label: 'Gallery', icon: Images, blurb: 'Our work & events' },
  { to: '/contact', label: 'Contact Us', icon: PhoneCall, blurb: 'Talk to our team' },
];

export default function Navbar({ transparent = false }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dark = transparent && !scrolled && !open;

  return (
    <header
      className={cx(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        dark ? 'bg-transparent' : 'border-b border-navy-100/80 bg-white/80 shadow-[0_1px_0_rgba(10,17,34,.02)] backdrop-blur-xl'
      )}
    >
      <nav className="container-page flex h-[72px] items-center justify-between gap-6" aria-label="Main navigation">
        <Logo onDark={dark} />

        <ul className={cx('hidden items-center gap-0.5 rounded-full p-1 xl:flex', dark ? 'bg-white/[.04] ring-1 ring-white/10 backdrop-blur' : 'bg-navy-50/70 ring-1 ring-navy-100')}>
          {MAIN_NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cx(
                    'group relative block whitespace-nowrap rounded-full px-4 py-2 text-[14px] font-semibold transition-all duration-300',
                    isActive
                      ? dark ? 'bg-white text-navy-950 shadow-lift' : 'bg-white text-navy-950 shadow-soft'
                      : dark ? 'text-white/75 hover:text-white' : 'text-navy-600 hover:text-navy-950'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {!isActive && (
                      <span className="absolute inset-x-4 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-transform duration-300 group-hover:scale-x-100" aria-hidden />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 xl:flex">
          {REFERRALS_ENABLED && (
            <NavLink
              to="/referrals"
              className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold transition', dark ? 'text-brand-200 hover:text-brand-100' : 'text-brand-700 hover:text-brand-600')}
            >
              <Gift className="h-4 w-4" aria-hidden /> Refer & Earn
            </NavLink>
          )}
          <Button to="/recruiting" variant="brand" size="sm">Apply now</Button>
        </div>

        <button
          type="button"
          className={cx('rounded-xl p-2 xl:hidden', dark ? 'text-white' : 'text-navy-900')}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-nav" className="animate-fade-in border-t border-navy-100 bg-white xl:hidden">
          <ul className="container-page grid max-h-[calc(100vh-72px)] gap-1 overflow-y-auto py-4 sm:grid-cols-2">
            {[...MAIN_NAV, ...(REFERRALS_ENABLED ? [{ to: '/referrals', label: 'Refer & Earn', icon: Gift, blurb: 'Earn points for referrals' }] : [])].map(({ to, label, icon: Icon, blurb }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) => cx('flex items-center gap-3 rounded-2xl px-3 py-3 transition', isActive ? 'bg-brand-50' : 'hover:bg-navy-50')}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-950 text-brand-300">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-navy-900">{label}</span>
                    <span className="block text-xs text-navy-400">{blurb}</span>
                  </span>
                </NavLink>
              </li>
            ))}
            <li className="mt-3 grid gap-2 sm:col-span-2">
              <Button to="/recruiting" variant="brand">Apply now</Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
