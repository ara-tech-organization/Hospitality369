import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import Button from '../ui/Button';
import { usePublicConfig } from '../../hooks/usePublicConfig';
import { COMPANY } from '../../content/site';
import { REFERRALS_ENABLED } from '../../lib/features';

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      ['Recruiting', '/recruiting'],
      ['Mentoring', '/mentoring'],
      ['Training', '/training'],
      ['Coaching', '/coaching'],
      ...(REFERRALS_ENABLED ? [['Refer & Earn', '/referrals']] : []),
    ],
  },
  {
    title: 'Industries',
    links: [
      ['Hotel & resort jobs', '/recruiting#roles'],
      ['Restaurant jobs', '/recruiting#roles'],
      ['Bar jobs', '/recruiting#roles'],
      ['Banquet & event jobs', '/recruiting#roles'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['Gallery', '/gallery'],
      ['Contact Us', '/contact'],
      ['Privacy notice', '/privacy'],
      ['Team sign in', '/login'],
    ],
  },
];

export default function Footer() {
  const config = usePublicConfig();
  const contact = config?.contact;
  const phone = contact?.contactPhone || COMPANY.phone;
  const address = contact?.address || COMPANY.address;

  return (
    <footer className="relative isolate overflow-hidden bg-navy-950 text-navy-200">
      <div className="hex-pattern absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div className="absolute -top-48 left-1/2 -z-10 h-96 w-[64rem] -translate-x-1/2 rounded-full bg-brand-500/15 blur-[120px]" aria-hidden />

      {/* Contact strip */}
      <div className="container-page pt-16">
        <div className="grid gap-4 rounded-[28px] border border-white/10 bg-white/[.04] p-6 backdrop-blur sm:p-8 lg:grid-cols-[1.3fr_1fr_1fr_1.4fr] lg:items-center">
          <div>
            <p className="font-display text-2xl font-semibold text-white">Let's build your team.</p>
            <p className="mt-1 text-sm text-navy-300">Talk to our hospitality specialists today.</p>
          </div>
          <a href={`tel:${phone.replace(/\s/g, '')}`} className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white/5">
            <span className="hex flex h-11 w-10 items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-white"><Phone className="h-4 w-4" aria-hidden /></span>
            <span><span className="block text-xs text-navy-400">Call us</span><span className="font-semibold text-white group-hover:text-brand-300">{phone}</span></span>
          </a>
          {contact?.contactEmail && (
            <a href={`mailto:${contact.contactEmail}`} className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white/5">
              <span className="hex flex h-11 w-10 items-center justify-center bg-white/10 text-brand-300"><Mail className="h-4 w-4" aria-hidden /></span>
              <span className="min-w-0"><span className="block text-xs text-navy-400">Email</span><span className="block truncate font-semibold text-white group-hover:text-brand-300">{contact.contactEmail}</span></span>
            </a>
          )}
          <div className="flex items-center gap-3 p-2">
            <span className="hex flex h-11 w-10 shrink-0 items-center justify-center bg-white/10 text-brand-300"><MapPin className="h-4 w-4" aria-hidden /></span>
            <span><span className="block text-xs text-navy-400">Visit us</span><span className="text-sm font-medium text-white">{address}</span></span>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.4fr_2fr]">
        <div>
          <Link to="/" aria-label="Hospitality369 – home" className="group inline-flex items-center gap-4">
            <img
              src="/hospitality-logo-change-3.webp"
              alt=""
              width="277"
              height="311"
              className="h-16 w-auto transition-transform duration-700 group-hover:rotate-[60deg] group-hover:scale-105"
            />
            <span className="font-display text-[26px] font-semibold leading-none tracking-[-.01em] text-white">
              Hospitality <span className="font-bold italic text-brand-400">369</span>
            </span>
          </Link>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-navy-300">{COMPANY.about}</p>
          <Button to="/recruiting" variant="brand" size="sm" className="mt-7" iconRight={ArrowUpRight}>Apply for a role</Button>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="font-sans text-xs font-semibold uppercase tracking-[.2em] text-brand-300">{col.title}</h2>
              <ul className="mt-5 space-y-3 text-sm">
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="link-underline pb-0.5 transition hover:text-white">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-navy-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Hospitality369. All rights reserved.</p>
          <p>Hotels · Resorts · Restaurants · Bars · Banquet Halls</p>
        </div>
      </div>
    </footer>
  );
}
