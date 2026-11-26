import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, ArrowLeft, Hotel, UtensilsCrossed, Wine, PartyPopper, Plus, Phone, MapPin, Gift, ChefHat, BedDouble,
  Lightbulb, Store, ConciergeBell, Check,
} from 'lucide-react';
import Seo from '../../components/seo/Seo';
import Button from '../../components/ui/Button';
import Index from '../../components/ui/SectionIndex';
import {
  Reveal, CountUp, RotatingWords, Magnetic, LineReveal, useParallax, parallax, CircularText, Tilt,
} from '../../components/motion';
import { useApi } from '../../hooks/useApi';
import { usePublicConfig } from '../../hooks/usePublicConfig';
import { INDUSTRY_LABEL } from '../../lib/constants';
import { cx } from '../../lib/format';
import { COMPANY, SERVICES, FEATURED_SERVICES, IMAGES, INDUSTRY_IMAGE } from '../../content/site';

/** FAQ section is built but hidden for now – flip to true to show it (and its FAQPage structured data). */
const SHOW_FAQ = false;

const FAQ = [
  ['Which industries does Hospitality369 recruit for?', 'We focus exclusively on hospitality: hotels, resorts, restaurants, bars and banquet halls. Every role and every recruiter understands service, shifts and guest experience.'],
  ['How do I apply for a hospitality job?', 'Go to Recruiting, choose the role and position you want, fill in your name, email and mobile number and upload your CV as a PDF, DOC or DOCX. It takes about three minutes.'],
  ['Is my CV kept private?', 'Yes. CVs are stored in private storage and can only be opened by authorised members of our recruitment team. Every download is logged.'],
  ['Can I apply for more than one role?', 'Absolutely – you can apply for any number of different roles. To keep things fair, repeat applications for the same role are limited for a short period.'],
  ['How does the referral programme work?', 'Join for free, share your personal link, and earn points when the people you refer apply, get shortlisted and get hired.'],
];

/* ============================== small parts ============================== */

/* ================================= HERO ================================= */

const HEX_W = 168;
const HEX_H = Math.round(HEX_W * 1.1547);
const G = 12;
const HEXES = [
  { dx: 0, dy: 0, center: true },
  { dx: -(HEX_W + G), dy: 0, img: IMAGES.hotel, label: 'Hotels & resorts', icon: Hotel, depth: -18 },
  { dx: HEX_W + G, dy: 0, img: IMAGES.bar, label: 'Bars', icon: Wine, depth: 22 },
  { dx: -(HEX_W + G) / 2, dy: -(HEX_H * 0.75 + G), img: IMAGES.fineDining, label: 'Restaurants', icon: UtensilsCrossed, depth: 26 },
  { dx: (HEX_W + G) / 2, dy: -(HEX_H * 0.75 + G), img: IMAGES.chef, label: 'Kitchens', icon: ChefHat, depth: -14 },
  { dx: -(HEX_W + G) / 2, dy: HEX_H * 0.75 + G, img: IMAGES.banquet, label: 'Banquet halls', icon: PartyPopper, depth: 16 },
  { dx: (HEX_W + G) / 2, dy: HEX_H * 0.75 + G, img: IMAGES.room, label: 'Rooms & housekeeping', icon: BedDouble, depth: -24 },
];

function Honeycomb({ openRoles }) {
  return (
    <div className="relative mx-auto h-[600px] w-full max-w-[560px]">
      {HEXES.map((h, i) => {
        const style = {
          left: `calc(50% + ${h.dx}px - ${HEX_W / 2}px)`,
          top: `calc(50% + ${h.dy}px - ${HEX_H / 2}px)`,
          width: HEX_W,
          height: HEX_H,
          animationDelay: `${200 + i * 90}ms`,
        };
        if (h.center) {
          return (
            <Link key="center" to="/recruiting" style={style} className="hex group absolute z-10 flex animate-scale-in flex-col items-center justify-center bg-navy-950 text-center text-white transition-transform duration-500 hover:scale-105">
              <span className="hex-pattern absolute inset-0" aria-hidden />
              <span className="absolute inset-0 bg-gradient-to-br from-brand-500/0 to-brand-500/30 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
              <span className="relative flex h-2.5 w-2.5" aria-hidden>
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-400" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="relative mt-3 font-display text-5xl font-bold leading-none">{openRoles ?? '—'}</span>
              <span className="relative mt-1 text-xs font-semibold uppercase tracking-[.18em] text-brand-300">Open roles</span>
              <span className="relative mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-navy-200 transition-all group-hover:gap-2 group-hover:text-white">Apply <ArrowRight className="h-3 w-3" /></span>
            </Link>
          );
        }
        const Icon = h.icon;
        return (
          <div key={h.label} className="absolute animate-scale-in hover:z-20" style={{ ...style, ...parallax(h.depth) }}>
            <div className="hex group relative h-full w-full cursor-default overflow-hidden bg-navy-100 transition-transform duration-500 hover:scale-[1.07]">
              <img src={h.img} alt={h.label} className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-125" fetchpriority={i < 3 ? 'high' : undefined} />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/10 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="absolute inset-x-0 bottom-7 flex translate-y-3 flex-col items-center text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <Icon className="h-5 w-5 text-brand-300" aria-hidden />
                <span className="mt-1 px-4 text-center text-xs font-semibold leading-tight">{h.label}</span>
              </div>
            </div>
          </div>
        );
      })}

      <div className="absolute -left-2 bottom-2 z-20 hidden sm:block" style={parallax(30)}>
        <Link to="/recruiting" className="group relative flex h-[132px] w-[132px] items-center justify-center rounded-full bg-white shadow-lift ring-1 ring-navy-100" aria-label="Apply now">
          <CircularText text="30+ years · hospitality expertise · " size={132} className="absolute inset-0 text-navy-700" />
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow transition-transform duration-500 group-hover:rotate-45 group-hover:scale-110">
            <ArrowUpRight className="h-6 w-6" aria-hidden />
          </span>
        </Link>
      </div>
    </div>
  );
}

function Hero() {
  const handlers = useParallax();
  const { data } = useApi('/public/roles');
  return (
    <section {...handlers} className="mesh-light relative isolate overflow-hidden pb-20 pt-28 lg:min-h-[100svh] lg:pt-32">
      <div className="pointer-events-none absolute inset-0 -z-10 [background:radial-gradient(520px_circle_at_var(--mx,75%)_var(--my,35%),rgba(247,144,30,.14),transparent_60%)]" aria-hidden />
      <div className="hex-pattern-dark absolute inset-0 -z-20 [mask-image:radial-gradient(ellipse_at_75%_45%,black_5%,transparent_65%)]" aria-hidden />
      <div className="absolute -right-48 -top-48 -z-20 h-[40rem] w-[40rem] animate-aurora rounded-full bg-brand-300/40 blur-[130px]" aria-hidden />

      <div className="container-page grid items-center gap-10 lg:grid-cols-[1.08fr_1fr]">
        <div className="relative z-10">
          <p className="flex animate-fade-up items-center gap-3 text-sm font-semibold text-navy-600">
            <span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500" /><span className="relative h-2 w-2 rounded-full bg-brand-500" /></span>
            Hospitality recruitment · Chennai
          </p>

          <h1 className="mt-7 text-[42px] font-semibold leading-[1.02] tracking-[-.045em] text-navy-950 sm:text-[60px] xl:text-[70px]">
            <LineReveal
              delay={120}
              lines={[
                'Exceptional people',
                'for unforgettable',
                <span key="l4" className="whitespace-nowrap"><RotatingWords className="brand-text pr-1" words={['hotels.', 'restaurants.', 'bars.', 'banquets.', 'resorts.']} /></span>,
              ]}
            />
          </h1>

          <p className="mt-8 max-w-lg animate-fade-up text-lg leading-relaxed text-navy-500 [animation-delay:500ms]">
            Hotels, restaurants, bars and banquet halls are hiring. Find your role and apply in about three minutes.
          </p>

          <div className="mt-10 flex animate-fade-up flex-wrap items-center gap-3 [animation-delay:600ms]">
            <Magnetic><Button to="/recruiting" variant="brand" size="lg" iconRight={ArrowRight}>Apply for a role</Button></Magnetic>
            <Magnetic><Button href="#open-roles" variant="outline" size="lg">View open roles</Button></Magnetic>
          </div>

          <dl className="mt-14 grid max-w-lg animate-fade-up grid-cols-3 divide-x divide-navy-100 [animation-delay:700ms]">
            {[[data?.roles?.length || 0, '', 'Open roles'], [4, '', 'Industries'], [30, '+', 'Years experience']].map(([n, s, l], i) => (
              <div key={l} className={cx(i ? 'pl-6' : 'pr-6')}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-3xl font-bold text-navy-950 sm:text-4xl"><CountUp end={n} suffix={s} /></dd>
                <dd className="mt-1 text-xs font-medium text-navy-400">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative hidden lg:block">
          <Honeycomb openRoles={data?.roles?.length} />
        </div>

        <div className="grid grid-cols-3 gap-3 lg:hidden" aria-hidden>
          {[IMAGES.hotel, IMAGES.chef, IMAGES.bar].map((src, i) => (
            <div key={src} className={cx('hex aspect-[.866] overflow-hidden', i === 1 && 'translate-y-6')}><img src={src} alt="" className="h-full w-full object-cover" /></div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ PATHWAY PANELS ============================ */

const PATHS = [
  { to: '/recruiting', n: '01', title: 'Recruiting', img: IMAGES.chef, text: 'Your next hospitality role.', cta: 'Apply for a role' },
  { to: '/mentoring', n: '02', title: 'Mentoring', img: IMAGES.team, text: 'Guidance from hospitality leaders.', cta: 'Find a mentor' },
  { to: '/training', n: '03', title: 'Training', img: IMAGES.cooking, text: 'Job-ready service skills.', cta: 'Explore courses' },
  { to: '/coaching', n: '04', title: 'Coaching', img: IMAGES.groupDining, text: 'Lead teams with confidence.', cta: 'Book coaching' },
];

function Pathways() {
  const [active, setActive] = useState(0);
  return (
    <section className="bg-white pb-28" aria-labelledby="paths-heading">
      <div className="container-page">
        <div className="grid gap-8 border-t border-navy-100 pt-16 lg:items-end">
          <Reveal>
            <Index n="03" label="Pathways" />
            <h2 id="paths-heading" className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-.04em] sm:text-6xl">Get hired. Keep <span className="brand-text">growing.</span></h2>
          </Reveal>
        </div>

        <Reveal className="mt-12 flex flex-col gap-3 lg:h-[460px] lg:flex-row">
          {PATHS.map((p, i) => {
            const on = active === i;
            return (
              <Link
                key={p.to}
                to={p.to}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={cx(
                  'group relative h-[340px] overflow-hidden rounded-[32px] transition-[flex-grow] duration-700 ease-[cubic-bezier(.16,1,.3,1)] lg:h-auto lg:min-w-[96px]',
                  on ? 'lg:flex-[3]' : 'lg:flex-[1]'
                )}
              >
                <img src={p.img} alt="" loading="lazy" className={cx('absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out', on ? 'scale-105' : 'scale-125 grayscale-[40%]')} />
                <div className={cx('absolute inset-0 transition-colors duration-700', on ? 'bg-gradient-to-t from-navy-950 via-navy-950/40 to-transparent' : 'bg-navy-950/70')} />
                <span className="absolute left-7 top-7 font-display text-sm font-bold tracking-widest text-brand-300">( {p.n} )</span>
                <span className={cx('absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/30 text-white transition-all duration-500', on ? 'rotate-0 border-brand-400 bg-brand-500' : '-rotate-45')}>
                  <ArrowUpRight className="h-5 w-5" aria-hidden />
                </span>

                <span className={cx('vertical-text absolute bottom-8 left-7 hidden font-display text-3xl font-semibold text-white transition-opacity duration-300 lg:block', on ? 'opacity-0' : 'opacity-100 delay-300')}>{p.title}</span>

                <div className={cx('absolute inset-x-0 bottom-0 p-7 text-white transition-all duration-500 sm:p-10', on ? 'lg:translate-y-0 lg:opacity-100 lg:delay-200' : 'lg:pointer-events-none lg:translate-y-6 lg:opacity-0')}>
                  <h3 className="font-display text-4xl font-semibold text-white sm:text-5xl">{p.title}</h3>
                  <p className="mt-3 max-w-md text-navy-100">{p.text}</p>
                  <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy-950 transition-all group-hover:gap-3">
                    {p.cta} <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

/* ================================ RIBBONS ================================ */

function Ribbon({ items, className, reverse, textClassName }) {
  const all = [...items, ...items, ...items, ...items];
  return (
    <div className={cx('absolute left-[-5%] w-[110%] overflow-hidden py-5 shadow-lift', className)}>
      <div className={cx('flex w-max items-center gap-8 whitespace-nowrap', reverse ? 'animate-marquee-reverse' : 'animate-marquee')}>
        {all.map((t, i) => (
          <span key={i} className={cx('flex items-center gap-8 font-display text-2xl font-bold uppercase tracking-[.04em] sm:text-4xl', textClassName)}>
            {t}
            <span className="hex h-5 w-[18px] bg-current opacity-60" aria-hidden />
          </span>
        ))}
      </div>
    </div>
  );
}

function Ribbons() {
  return (
    <section className="relative h-[260px] overflow-hidden bg-mist sm:h-[300px]" aria-label="Hospitality369 at a glance">
      <Ribbon className="top-[34%] -rotate-[4deg] bg-navy-950" textClassName="text-white" reverse items={['Hotels', 'Resorts', 'Restaurants', 'Bars', 'Banquet halls', 'Weddings', 'Catering']} />
      <Ribbon className="top-[38%] rotate-[3deg] bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" textClassName="text-white" items={['30+ years experience', '560+ services delivered', '98% client satisfaction', 'Up to 2,500 guests catered']} />
    </section>
  );
}

/* ================== COVERING ALL FIELDS – ARCH PORTALS ================== */

const FEATURED_ICON = { consulting: Lightbulb, franchise: Store, catering: ConciergeBell };

function ArchCard({ s, i }) {
  const Icon = FEATURED_ICON[s.key];
  return (
    <Tilt max={6} className="h-full">
      <article className="group relative h-[540px] sm:h-[580px]">
        {/* orange arch outline that draws in on hover */}
        <span className="pointer-events-none absolute -inset-3 rounded-b-[44px] rounded-t-[999px] border-2 border-brand-400/0 opacity-0 transition-all duration-700 group-hover:-inset-4 group-hover:border-brand-400/70 group-hover:opacity-100" aria-hidden />

        <div className="relative h-full overflow-hidden rounded-b-[36px] rounded-t-[999px] bg-navy-900 shadow-[0_40px_80px_-35px_rgba(11,16,48,.6)] transition-shadow duration-700 group-hover:shadow-glow-lg">
          <img src={s.image} alt={s.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-all duration-[1.4s] ease-out group-hover:scale-110 lg:grayscale-[35%] lg:group-hover:grayscale-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/25 to-transparent" />

          {/* big outlined number */}
          <span className="text-outline-light absolute left-1/2 top-16 hidden -translate-x-1/2 font-display lg:block text-[120px] font-bold leading-none transition-all duration-700 group-hover:top-12 group-hover:opacity-0">0{i + 1}</span>

          {/* hexagon badge with rotating ring */}
          <div className="absolute left-1/2 top-14 -translate-x-1/2 transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] lg:top-[38%] lg:group-hover:top-14">
            <svg viewBox="0 0 48 48" className="absolute -inset-4 h-[calc(100%+2rem)] w-[calc(100%+2rem)] animate-spin-slow text-white/40" aria-hidden>
              <path d="M24 2 43 13v22L24 46 5 35V13z" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray="2 2" />
            </svg>
            <span className="hex relative flex h-[84px] w-[74px] items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow transition-transform duration-700 group-hover:rotate-[30deg]">
              <Icon className="h-8 w-8 transition-transform duration-700 group-hover:-rotate-[30deg]" aria-hidden />
            </span>
          </div>

          {/* content: title always, details rise on hover (always visible on touch screens) */}
          <div className="absolute inset-x-0 bottom-0 p-7 text-center sm:p-9">
            <h3 className="font-display text-3xl font-semibold text-white">{s.title}</h3>
            <div className="grid transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] lg:grid-rows-[0fr] lg:opacity-0 lg:group-hover:grid-rows-[1fr] lg:group-hover:opacity-100">
              <div className="overflow-hidden">
                <p className="mt-4 text-sm leading-relaxed text-navy-100">{s.text}</p>
                <ul className="mt-5 flex flex-wrap justify-center gap-2">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur">
                      <Check className="h-3 w-3 text-brand-300" aria-hidden />{p}
                    </li>
                  ))}
                </ul>
                <a href={`tel:${COMPANY.phone.replace(/\s/g, '')}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy-950 transition-all hover:gap-3 hover:bg-brand-500 hover:text-white">
                  Talk to us <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Tilt>
  );
}

function CoveringFields() {
  return (
    <section className="relative isolate overflow-hidden bg-white pb-40 pt-28" aria-labelledby="covering-heading">
      <div className="hex-pattern-dark absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" aria-hidden />
      <p className="text-outline pointer-events-none absolute left-1/2 top-24 -z-10 -translate-x-1/2 whitespace-nowrap font-display text-[120px] font-bold leading-none tracking-[-.04em] opacity-60 sm:text-[200px]" aria-hidden>Services</p>
      <div className="container-page">
        <Reveal className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center"><Index n="04" label="What we cover" /></div>
          <h2 id="covering-heading" className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-.04em] sm:text-6xl">
            Covering all the hospitality <span className="brand-text">service fields.</span>
          </h2>
        </Reveal>
        <div className="mx-auto mt-20 grid max-w-6xl gap-8 md:grid-cols-3 lg:gap-10">
          {FEATURED_SERVICES.map((s, i) => (
            <Reveal key={s.key} delay={i * 140}>
              <div className={cx(i === 1 && 'lg:translate-y-20')}>
                <ArchCard s={s} i={i} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =================== WHAT WE DO – VERTICAL MARQUEE COLUMNS =================== */
/* Display-only: three columns of service tiles drift up/down at different speeds. */

function ServiceTile({ s, n, hidden, compact }) {
  return (
    <article
      aria-hidden={hidden || undefined}
      className="group relative overflow-hidden rounded-[28px] bg-white/[.04] ring-1 ring-white/10 transition-all duration-500 hover:-translate-y-1 hover:bg-white/[.08] hover:ring-brand-400/50"
    >
      <div className={cx('relative overflow-hidden', compact ? 'h-24' : 'h-36')}>
        <img src={s.image} alt="" loading="lazy" className="h-full w-full object-cover grayscale-[30%] transition-all duration-[1.2s] ease-out group-hover:scale-110 group-hover:grayscale-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/30 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-navy-950/70 px-2.5 py-1 font-display text-xs font-bold text-brand-300 backdrop-blur">{String(n).padStart(2, '0')}</span>
      </div>
      <div className={cx('relative', compact ? 'p-3.5 pt-2' : 'p-5 pt-3')}>
        <span className={cx('absolute -top-6 right-5 h-11 w-11', compact ? 'hidden' : 'flex')} aria-hidden>
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow transition-transform duration-500 group-hover:rotate-[-8deg] group-hover:scale-110">
            <s.icon className="h-5 w-5" aria-hidden />
          </span>
        </span>
        <h3 className={cx('font-display font-semibold text-white', compact ? 'text-sm leading-snug' : 'pr-12 text-xl')}>{s.title}</h3>
        {!compact && <p className="mt-2 text-sm leading-relaxed text-navy-300 transition-colors duration-300 group-hover:text-navy-100">{s.text}</p>}
      </div>
    </article>
  );
}

function Services() {
  // Distribute the 9 services across 3 columns (each column loops its own list)
  const cols = [0, 1, 2].map((c) => SERVICES.map((s, i) => ({ s, n: i + 1 })).filter((_, i) => i % 3 === c));
  const speeds = ['48s', '62s', '54s'];
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 py-24 text-white sm:py-28" aria-labelledby="services-heading">
      <div className="hex-pattern absolute inset-0 -z-10 opacity-60" aria-hidden />
      <div className="absolute -right-40 top-1/3 -z-10 h-[30rem] w-[30rem] animate-aurora rounded-full bg-brand-500/20 blur-[120px]" aria-hidden />
      <div className="container-page grid items-center gap-12 lg:grid-cols-[.75fr_1.6fr]">
        <Reveal>
          <Index n="05" label="What we do" dark />
          <h2 id="services-heading" className="mt-6 text-4xl font-semibold leading-[1.04] tracking-[-.04em] text-white sm:text-5xl">Expertise for every part of your <span className="brand-text">business.</span></h2>
          <div className="mt-10 flex items-end gap-4">
            <span className="font-display text-7xl font-bold leading-none text-white"><CountUp end={SERVICES.length} /></span>
            <span className="pb-2 text-sm leading-snug text-navy-300">hospitality<br />service fields</span>
          </div>
        </Reveal>

        {/* Desktop/tablet: moving columns */}
        <div className="ticker-mask relative hidden h-[640px] grid-cols-3 gap-5 overflow-hidden sm:grid" aria-label="Our services">
          {cols.map((col, c) => (
            <div key={c} className={cx('group/col', c === 1 && 'pt-16')}>
              <div
                className="space-y-5 group-hover/col:[animation-play-state:paused]"
                style={{
                  animationName: 'svc-ticker',
                  animationDuration: speeds[c],
                  animationTimingFunction: 'linear',
                  animationIterationCount: 'infinite',
                  animationDirection: c === 1 ? 'reverse' : 'normal',
                }}
              >
                {[...col, ...col].map(({ s, n }, k) => (
                  <ServiceTile key={`${s.title}-${k}`} s={s} n={n} hidden={k >= col.length} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Phones: simple static grid */}
        <div className="grid grid-cols-2 gap-3 sm:hidden">
          {SERVICES.map((s, i) => <ServiceTile key={s.title} s={s} n={i + 1} compact />)}
        </div>
      </div>
    </section>
  );
}

/* =========================== ROLES – CAROUSEL =========================== */

function RolesCarousel() {
  const { data, loading } = useApi('/public/roles');
  const roles = data?.roles || [];
  const track = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    const on = () => setProgress(el.scrollWidth > el.clientWidth ? el.scrollLeft / (el.scrollWidth - el.clientWidth) : 1);
    on();
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, [roles.length]);

  const scroll = (dir) => track.current?.scrollBy({ left: dir * 360, behavior: 'smooth' });

  return (
    <section id="open-roles" className="scroll-mt-16 bg-mist py-24" aria-labelledby="roles-heading">
      <div className="container-page flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <Reveal>
          <Index n="01" label="Open roles" />
          <h2 id="roles-heading" className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-.04em] sm:text-6xl">Hiring <span className="brand-text">right now.</span></h2>
        </Reveal>
        <Reveal delay={100} className="flex items-center gap-3">
          <button type="button" onClick={() => scroll(-1)} className="flex h-14 w-14 items-center justify-center rounded-full border border-navy-200 bg-white text-navy-800 transition hover:-translate-x-0.5 hover:border-navy-900 hover:bg-navy-900 hover:text-white" aria-label="Previous roles">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => scroll(1)} className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-950 text-white transition hover:translate-x-0.5 hover:bg-brand-500" aria-label="Next roles">
            <ArrowRight className="h-5 w-5" />
          </button>
          <Link to="/recruiting" className="link-underline ml-3 text-sm font-semibold text-navy-800">All roles</Link>
        </Reveal>
      </div>

      <div
        ref={track}
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-4 [padding-inline:max(1.25rem,calc((100vw-80rem)/2+2rem))] [scroll-padding-inline:max(1.25rem,calc((100vw-80rem)/2+2rem))]"
      >
        {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[420px] w-[320px] shrink-0 rounded-[28px]" />)}
        {roles.map((r) => (
          <Link key={r._id} to={`/recruiting?role=${r._id}#apply`} className="group relative flex w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-[28px] bg-white shadow-soft ring-1 ring-navy-100 transition duration-500 hover:-translate-y-2 hover:shadow-lift sm:w-[340px]">
            <div className="relative h-52 overflow-hidden">
              <img src={INDUSTRY_IMAGE[r.industry]} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 to-transparent" />
              <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-navy-900 backdrop-blur">{INDUSTRY_LABEL[r.industry]}</span>
              <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white opacity-0 transition-all duration-500 group-hover:rotate-45 group-hover:opacity-100">
                <ArrowUpRight className="h-5 w-5" aria-hidden />
              </span>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-display text-2xl font-semibold text-navy-950">{r.title}</h3>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {r.positions.slice(0, 3).map((p) => <span key={p} className="rounded-full bg-mist px-2.5 py-1 text-[11px] font-semibold text-navy-600 ring-1 ring-navy-100">{p}</span>)}
                {r.positions.length > 3 && <span className="rounded-full px-2 py-1 text-[11px] font-semibold text-navy-400">+{r.positions.length - 3}</span>}
              </div>
              <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-brand-600 transition-all group-hover:gap-3">Apply now <ArrowRight className="h-4 w-4" aria-hidden /></span>
            </div>
          </Link>
        ))}
        <div className="w-1 shrink-0" aria-hidden />
      </div>

      <div className="container-page mt-8">
        <div className="h-1 overflow-hidden rounded-full bg-navy-100">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-[width] duration-300" style={{ width: `${Math.max(12, progress * 100)}%` }} />
        </div>
      </div>
    </section>
  );
}

/* ========================== PROCESS – STACKING ========================== */

const STEPS = [
  { n: '01', title: 'Choose your role', text: 'Pick a live role that fits you.', img: IMAGES.restaurant, tone: 'bg-white ring-1 ring-navy-100' },
  { n: '02', title: 'Upload your CV', text: 'PDF or Word – stored privately.', img: IMAGES.room, tone: 'bg-navy-950' },
  { n: '03', title: 'Get matched & grow', text: 'Our specialists take it from here.', img: IMAGES.terrace, tone: 'bg-gradient-to-br from-brand-400 to-brand-600' },
];

function Process() {
  return (
    <section className="bg-white py-28" aria-labelledby="process-heading">
      <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.25fr]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Index n="02" label="How it works" />
          <h2 id="process-heading" className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-.04em] sm:text-6xl">Three steps to<br />your <span className="brand-text">next role.</span></h2>
          <div className="mt-8"><Magnetic><Button to="/recruiting" variant="primary" size="lg" iconRight={ArrowRight}>Start now</Button></Magnetic></div>
        </div>
        <div className="space-y-6 pb-[6vh]">
          {STEPS.map((s, i) => (
            <article key={s.n} className={cx('sticky grid overflow-hidden rounded-[32px] shadow-lift sm:grid-cols-[1.2fr_1fr]', s.tone)} style={{ top: `${120 + i * 28}px` }}>
              <div className="flex flex-col p-8 sm:p-10">
                <span className={cx('font-display text-7xl font-bold leading-none', i === 0 ? 'text-brand-500' : 'text-white/25')}>{s.n}</span>
                <h3 className={cx('mt-10 text-3xl font-semibold', i === 0 ? 'text-navy-950' : 'text-white')}>{s.title}</h3>
                <p className={cx('mt-3 leading-relaxed', i === 0 ? 'text-navy-500' : 'text-white/85')}>{s.text}</p>
              </div>
              <div className="relative min-h-[220px] overflow-hidden">
                <img src={s.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] hover:scale-110" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================== FAQ ================================== */

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="bg-mist py-28" aria-labelledby="faq-heading">
      <div className="container-page grid gap-14 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <Index n="07" label="FAQ" />
          <h2 id="faq-heading" className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-.04em] sm:text-6xl">Good <span className="brand-text">questions.</span></h2>
        </div>
        <div className="divide-y divide-navy-100 border-y border-navy-100">
          {FAQ.map(([q, a], i) => (
            <div key={q}>
              <h3 className="font-sans">
                <button type="button" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="group flex w-full items-center gap-6 py-7 text-left">
                  <span className="font-display text-sm font-bold text-brand-500">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 font-display text-xl font-semibold text-navy-950 transition group-hover:translate-x-1 sm:text-2xl">{q}</span>
                  <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-500', open === i ? 'rotate-45 bg-brand-500 text-white' : 'bg-white text-navy-700 ring-1 ring-navy-100 group-hover:bg-navy-950 group-hover:text-white')}>
                    <Plus className="h-4 w-4" aria-hidden />
                  </span>
                </button>
              </h3>
              <div className={cx('grid transition-all duration-500', open === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                <div className="overflow-hidden"><p className="max-w-2xl pb-7 pl-12 leading-relaxed text-navy-500">{a}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================ FINALE ================================ */

function Finale() {
  const config = usePublicConfig();
  return (
    <section className="relative isolate overflow-hidden bg-navy-950 pb-24 pt-28 text-white" aria-labelledby="finale-heading">
      <div className="hex-pattern absolute inset-0 -z-10" aria-hidden />
      <div className="absolute -bottom-64 left-1/2 -z-10 h-[34rem] w-[70rem] -translate-x-1/2 animate-aurora rounded-full bg-brand-500/30 blur-[120px]" aria-hidden />
      <div className="container-page">
        <div className="grid items-end gap-12 lg:grid-cols-[1fr_auto]">
          <h2 id="finale-heading" className="text-[52px] font-semibold leading-[.95] tracking-[-.05em] text-white sm:text-[96px] xl:text-[120px]">
            <Reveal as="span" className="block">Let&apos;s build</Reveal>
            <Reveal as="span" className="block" delay={120}>your <span className="brand-text">dream team.</span></Reveal>
          </h2>
          <Magnetic strength={0.45}>
            <Link to="/recruiting" className="group relative flex h-[190px] w-[190px] items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 shadow-glow-lg transition-transform duration-500 hover:scale-105" aria-label="Apply now">
              <CircularText text="Apply now · Join Hospitality369 · " size={190} className="absolute inset-0 text-white" />
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-600 transition-transform duration-500 group-hover:rotate-45">
                <ArrowUpRight className="h-7 w-7" aria-hidden />
              </span>
            </Link>
          </Magnetic>
        </div>

        <div className="mt-20 grid gap-4 border-t border-white/10 pt-10 md:grid-cols-3">
          <a href={`tel:${COMPANY.phone.replace(/\s/g, '')}`} className="group rounded-3xl border border-white/10 p-6 transition duration-500 hover:-translate-y-1 hover:border-brand-400/50 hover:bg-white/[.04]">
            <Phone className="h-5 w-5 text-brand-400" aria-hidden />
            <p className="mt-6 text-sm text-navy-300">Call our team</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">{COMPANY.phone}</p>
          </a>
          <div className="rounded-3xl border border-white/10 p-6">
            <MapPin className="h-5 w-5 text-brand-400" aria-hidden />
            <p className="mt-6 text-sm text-navy-300">Visit us</p>
            <p className="mt-1 text-lg font-semibold text-white">{COMPANY.address}</p>
          </div>
          {config?.referral?.enabled !== false ? (
            <Link to="/referrals" className="group rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 p-6 transition duration-500 hover:-translate-y-1 hover:shadow-glow-lg">
              <Gift className="h-5 w-5 text-white" aria-hidden />
              <p className="mt-6 text-sm text-white/85">Know someone brilliant?</p>
              <p className="mt-1 flex items-center gap-2 font-display text-2xl font-semibold text-white">Refer & earn points <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" aria-hidden /></p>
            </Link>
          ) : (
            <Link to="/training" className="group rounded-3xl border border-white/10 p-6 transition hover:bg-white/[.04]">
              <p className="font-display text-2xl font-semibold text-white">Explore training →</p>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ================================= PAGE ================================= */

export default function Home() {
  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          name: 'Hospitality369',
          url: window.location.origin,
          description: 'Hospitality recruitment, mentoring, training and coaching for hotels, restaurants, bars and banquet halls.',
        },
        // Only describe the FAQ to search engines when it is visible on the page
        ...(SHOW_FAQ
          ? [{ '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }]
          : []),
      ],
    }),
    []
  );

  return (
    <>
      <Seo jsonLd={jsonLd} />
      <Hero />
      <RolesCarousel />
      <Process />
      <Pathways />
      <Ribbons />
      <CoveringFields />
      <Services />
      {SHOW_FAQ && <Faq />}
      <Finale />
    </>
  );
}
