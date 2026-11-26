import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Hotel, UtensilsCrossed, Wine, PartyPopper, ArrowRight, ArrowDown, Check, Phone, ShieldCheck, Clock3, BadgeCheck, FileText, Sparkles,
} from 'lucide-react';
import Seo from '../../components/seo/Seo';
import ApplicationForm from '../../components/recruiting/ApplicationForm';
import Button from '../../components/ui/Button';
import Index from '../../components/ui/SectionIndex';
import { Reveal, Magnetic, LineReveal, CountUp, HexIcon, SpotlightCard } from '../../components/motion';
import { usePublicConfig } from '../../hooks/usePublicConfig';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { INDUSTRY_LABEL } from '../../lib/constants';
import { cx } from '../../lib/format';
import { COMPANY, IMAGES, INDUSTRY_IMAGE } from '../../content/site';

const INDUSTRY_ICON = { hotel: Hotel, restaurant: UtensilsCrossed, bar: Wine, banquet: PartyPopper };

const JOURNEY = [
  { key: 'personal', title: 'About you', text: 'Name, email & mobile' },
  { key: 'role', title: 'Role & position', text: 'Where you want to work' },
  { key: 'cv', title: 'Your CV', text: 'PDF, DOC or DOCX' },
  { key: 'consent', title: 'Submit', text: 'Accept privacy & send' },
];

/* ------------------------------- hero ------------------------------- */

function PhotoFan() {
  const cards = [
    { src: IMAGES.chef, alt: 'Chef at work', cls: 'left-[6%] top-[12%] -rotate-[9deg] group-hover:-translate-x-10 group-hover:-rotate-[14deg]', label: 'Kitchen' },
    { src: IMAGES.room, alt: 'Hotel room', cls: 'right-[4%] top-[4%] rotate-[8deg] group-hover:translate-x-10 group-hover:rotate-[13deg]', label: 'Hotels' },
    { src: IMAGES.bar, alt: 'Hotel bar', cls: 'left-1/2 top-[26%] -translate-x-1/2 rotate-[-1deg] group-hover:-translate-y-4 group-hover:scale-105', label: 'Bars', front: true },
  ];
  return (
    <div className="group relative mx-auto h-[520px] w-full max-w-[560px]" aria-hidden>
      <div className="absolute inset-10 rounded-full bg-gradient-to-br from-brand-200/60 to-navy-100 blur-3xl" />
      {cards.map((c) => (
        <figure
          key={c.label}
          className={cx(
            'absolute h-[330px] w-[250px] overflow-hidden rounded-[28px] border-[6px] border-white bg-white shadow-[0_40px_80px_-30px_rgba(11,16,48,.55)] transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)]',
            c.cls,
            c.front && 'z-10'
          )}
        >
          <img src={c.src} alt={c.alt} className="h-full w-full object-cover" />
          <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-navy-900 backdrop-blur">{c.label}</figcaption>
        </figure>
      ))}
      <div className="absolute bottom-6 left-0 z-20 flex animate-float items-center gap-3 rounded-2xl border border-white bg-white/90 py-3 pl-3 pr-5 shadow-lift backdrop-blur-xl">
        <HexIcon icon={BadgeCheck} tone="brand" size="sm" />
        <div><p className="text-sm font-semibold text-navy-950">Reviewed by specialists</p><p className="text-xs text-navy-400">who know hospitality</p></div>
      </div>
      <div className="absolute bottom-24 right-0 z-20 flex animate-float items-center gap-3 rounded-2xl bg-navy-950 py-3 pl-3 pr-5 text-white shadow-lift [animation-delay:1.6s]">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300"><Clock3 className="h-5 w-5" /></span>
        <div><p className="text-sm font-semibold">~3 minutes</p><p className="text-xs text-navy-300">to apply, no account</p></div>
      </div>
    </div>
  );
}

/* ---------------------------- role explorer ---------------------------- */

function RoleExplorer({ roles, loading, selectedId, onPick }) {
  const industries = useMemo(() => [...new Set(roles.map((r) => r.industry))], [roles]);
  const [industry, setIndustry] = useState(null);
  const current = industry || industries[0];
  const list = roles.filter((r) => r.industry === current);

  return (
    <section id="roles" className="scroll-mt-20 bg-white py-24" aria-labelledby="explorer-heading">
      <div className="container-page">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
          <Reveal>
            <Index n="01" label="Explore roles" />
            <h2 id="explorer-heading" className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-.04em] sm:text-6xl">Pick your <span className="brand-text">world.</span></h2>
          </Reveal>
          <Reveal delay={100} className="max-w-md text-lg text-navy-500 lg:justify-self-end">Choose an industry, then tap a role – we&apos;ll pre-fill it in your application below.</Reveal>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-44 rounded-[28px]" />)}
          {industries.map((ind, i) => {
            const on = ind === current;
            const Icon = INDUSTRY_ICON[ind];
            const count = roles.filter((r) => r.industry === ind).length;
            return (
              <Reveal key={ind} delay={i * 80}>
                <button
                  type="button"
                  onClick={() => setIndustry(ind)}
                  aria-pressed={on}
                  className={cx(
                    'group relative h-44 w-full overflow-hidden rounded-[28px] text-left transition-all duration-500 sm:h-52',
                    on ? 'ring-4 ring-brand-400 ring-offset-4 ring-offset-white' : 'hover:-translate-y-1'
                  )}
                >
                  <img src={INDUSTRY_IMAGE[ind]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
                  <span className={cx('absolute inset-0 transition-colors duration-500', on ? 'bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-transparent' : 'bg-navy-950/60 group-hover:bg-navy-950/45')} />
                  <span className="absolute left-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur"><Icon className="h-5 w-5" aria-hidden /></span>
                  <span className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
                    <span className="font-display text-2xl font-semibold">{INDUSTRY_LABEL[ind]}</span>
                    <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-bold text-navy-900">{count}</span>
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>

        <div key={current} className="mt-8 grid animate-fade-in gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => {
            const on = r._id === selectedId;
            return (
              <SpotlightCard
                as="button"
                type="button"
                key={r._id}
                onClick={() => onPick(r)}
                className={cx(
                  'group flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300',
                  on ? 'border-brand-400 bg-brand-50 shadow-soft' : 'border-navy-100 bg-mist hover:-translate-y-0.5 hover:border-navy-200 hover:bg-white hover:shadow-soft'
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-semibold text-navy-950">{r.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-navy-400">{r.positions.length ? r.positions.join(' · ') : 'Open position'}</span>
                </span>
                <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-500', on ? 'bg-brand-500 text-white' : 'bg-white text-navy-600 ring-1 ring-navy-100 group-hover:bg-navy-950 group-hover:text-white')}>
                  {on ? <Check className="h-4 w-4" aria-hidden /> : <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden />}
                </span>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- journey stepper ---------------------------- */

function Journey({ progress }) {
  const done = JOURNEY.filter((s) => progress[s.key]).length;
  const pct = progress.submitted ? 100 : Math.round((done / JOURNEY.length) * 100);
  const currentIdx = JOURNEY.findIndex((s) => !progress[s.key]);
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/[.04] p-7 backdrop-blur">
      <div className="flex items-end justify-between">
        <p className="text-sm font-semibold text-navy-200">Your application</p>
        <p className="font-display text-4xl font-bold text-white">{pct}<span className="text-lg text-navy-300">%</span></p>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-300 to-brand-600 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <ol className="relative mt-8 space-y-6">
        <span className="absolute bottom-3 left-[19px] top-3 w-px bg-white/10" aria-hidden />
        {JOURNEY.map((s, i) => {
          const ok = progress.submitted || progress[s.key];
          const now = !progress.submitted && i === currentIdx;
          return (
            <li key={s.key} className="relative flex items-center gap-4">
              <span
                className={cx(
                  'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-500',
                  ok ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow' : now ? 'bg-white text-navy-950' : 'bg-navy-900 text-navy-400 ring-1 ring-white/10'
                )}
              >
                {now && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-white/40" aria-hidden />}
                {ok ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
              </span>
              <span>
                <span className={cx('block font-semibold transition-colors', ok || now ? 'text-white' : 'text-navy-300')}>{s.title}</span>
                <span className="text-xs text-navy-400">{s.text}</span>
              </span>
              <span className="sr-only">{ok ? 'completed' : now ? 'in progress' : 'not started'}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* --------------------------------- page --------------------------------- */

export default function Recruiting() {
  const [params] = useSearchParams();
  const config = usePublicConfig();
  const toast = useToast();
  const { data, loading } = useApi('/public/roles');
  const roles = useMemo(() => data?.roles || [], [data]);
  const [pick, setPick] = useState(null);
  const [progress, setProgress] = useState({});
  const onProgress = useCallback((p) => setProgress(p), []);

  const refParam = params.get('ref');
  useEffect(() => {
    if (refParam) sessionStorage.setItem('h369_ref', refParam.toUpperCase().slice(0, 20));
  }, [refParam]);
  const initialRef = refParam || sessionStorage.getItem('h369_ref') || '';
  const selectedId = pick?.id || params.get('role') || '';

  const pickRole = (r) => {
    setPick({ id: r._id, nonce: Date.now() });
    toast.success(`${r.title} selected – complete your details below`);
    document.getElementById('apply')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const jsonLd = roles.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Hospitality roles at Hospitality369',
        itemListElement: roles.map((r, i) => ({ '@type': 'ListItem', position: i + 1, name: r.title, description: r.description })),
      }
    : undefined;

  return (
    <>
      <Seo jsonLd={jsonLd} />

      {/* ============ HERO ============ */}
      <section className="mesh-light relative isolate overflow-hidden pb-16 pt-28 lg:pt-36">
        <div className="hex-pattern-dark absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_70%_40%,black_5%,transparent_65%)]" aria-hidden />
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Index n="00" label="Recruiting" className="animate-fade-up" />
            <h1 className="mt-7 text-[44px] font-semibold leading-[1.02] tracking-[-.045em] text-navy-950 sm:text-[64px] xl:text-[76px]">
              <LineReveal
                delay={100}
                lines={[
                  'Your next role',
                  <>in <span className="brand-text">hospitality</span></>,
                  <>starts <span className="relative mx-[.1em] inline-block h-[.78em] w-[1.75em] overflow-hidden rounded-full align-[-.06em] shadow-lift ring-[5px] ring-white"><img src={IMAGES.fineDining} alt="" className="h-full w-full object-cover" /></span> here.</>,
                ]}
              />
            </h1>
            <p className="mt-8 max-w-lg animate-fade-up text-lg leading-relaxed text-navy-500 [animation-delay:450ms]">
              Hotels, resorts, restaurants, bars and banquet halls are hiring. Choose a role, add your details and upload your CV – our specialists take it from there.
            </p>
            <div className="mt-10 flex animate-fade-up flex-wrap gap-3 [animation-delay:550ms]">
              <Magnetic><Button href="#apply" variant="brand" size="lg" iconRight={ArrowRight}>Start application</Button></Magnetic>
              <Magnetic><Button href="#roles" variant="outline" size="lg">Browse roles</Button></Magnetic>
            </div>
            <dl className="mt-14 grid max-w-md animate-fade-up grid-cols-3 divide-x divide-navy-100 [animation-delay:650ms]">
              <div className="pr-5"><dt className="text-xs text-navy-400">Open roles</dt><dd className="mt-1 font-display text-3xl font-bold text-navy-950">{loading ? '—' : <CountUp end={roles.length} />}</dd></div>
              <div className="px-5"><dt className="text-xs text-navy-400">Industries</dt><dd className="mt-1 font-display text-3xl font-bold text-navy-950"><CountUp end={4} /></dd></div>
              <div className="pl-5"><dt className="text-xs text-navy-400">To apply</dt><dd className="mt-1 font-display text-3xl font-bold text-navy-950">~3<span className="text-base font-semibold text-navy-400"> min</span></dd></div>
            </dl>
          </div>
          <div className="hidden lg:block"><PhotoFan /></div>
        </div>
      </section>

      <RoleExplorer roles={roles} loading={loading} selectedId={selectedId} onPick={pickRole} />

      {/* ============ APPLICATION STUDIO ============ */}
      <section id="apply" className="relative isolate scroll-mt-16 overflow-clip bg-navy-950 py-24 text-white" aria-labelledby="apply-heading">
        <div className="hex-pattern absolute inset-0 -z-10" aria-hidden />
        <div className="absolute -left-40 top-20 -z-10 h-[32rem] w-[32rem] animate-aurora rounded-full bg-brand-500/25 blur-[120px]" aria-hidden />
        <div className="container-page grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Index n="02" label="Apply" dark />
            <h2 id="apply-heading" className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-.04em] text-white sm:text-5xl">Let&apos;s get you <span className="brand-text">hired.</span></h2>
            <div className="mt-10"><Journey progress={progress} /></div>
            <ul className="mt-8 space-y-3 text-sm text-navy-200">
              <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-brand-400" aria-hidden /> CVs stored privately · every access is logged</li>
              <li className="flex items-center gap-3"><Sparkles className="h-4 w-4 text-brand-400" aria-hidden /> You&apos;ll get your own referral code after applying</li>
              <li><a href={`tel:${COMPANY.phone.replace(/\s/g, '')}`} className="group inline-flex items-center gap-3 font-semibold text-white"><Phone className="h-4 w-4 text-brand-400" aria-hidden /><span className="link-underline">Need help? {COMPANY.phone}</span></a></li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-[36px] bg-white text-navy-900 shadow-[0_60px_120px_-40px_rgba(0,0,0,.7)]">
            <div className="flex items-center gap-4 border-b border-navy-100 bg-mist px-6 py-6 sm:px-10">
              <HexIcon icon={FileText} tone="brand" />
              <div>
                <h3 className="font-display text-2xl font-semibold text-navy-950">Candidate application</h3>
                <p className="text-sm text-navy-400">Fields marked <span className="text-coral-500">*</span> are required</p>
              </div>
            </div>
            <div className="p-6 sm:p-10">
              <ApplicationForm
                initialRole={params.get('role') || ''}
                initialRef={initialRef}
                maxMb={config?.maxResumeMb || 5}
                accepting={config ? config.acceptingApplications : true}
                selectRole={pick}
                onProgress={onProgress}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
