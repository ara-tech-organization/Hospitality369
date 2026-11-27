import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Users, Send, CheckCircle2 } from 'lucide-react';
import Seo from '../../components/seo/Seo';
import Button from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Form';
import { Alert } from '../../components/ui/Feedback';
import { useApi } from '../../hooks/useApi';
import api, { errorMessage, fieldErrors } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { PROGRAM_CONTENT } from './programContent';
import { NAV } from '../../components/layout/Navbar';
import { Reveal, SpotlightCard, Magnetic, LineReveal } from '../../components/motion';
import ModuleVisual from '../../components/programs/ModuleVisuals';
import { cx } from '../../lib/format';

function EnquiryForm({ module, programs, selected, onSelect }) {
  const toast = useToast();
  const [v, setV] = useState({ name: '', email: '', mobile: '', currentRole: '', message: '', website: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (v.name.trim().length < 2) errs.name = 'Enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) errs.email = 'Enter a valid email address';
    if (v.mobile && v.mobile.replace(/\D/g, '').length < 8) errs.mobile = 'Enter a valid mobile number';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/public/enquiries', { ...v, module, program: selected || '' });
      setDone(data.message);
      toast.success('Enquiry sent');
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="animate-scale-in py-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden />
        <h3 className="mt-4 font-display text-2xl">Thank you!</h3>
        <p className="mt-2 text-navy-500">{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div className="hidden" aria-hidden><input tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} /></div>
      <Select label="Programme" value={selected} onChange={(e) => onSelect(e.target.value)} placeholder="Not sure yet – advise me" error={errors.program}>
        {programs.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
      </Select>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" required value={v.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        <Input label="Email" required type="email" value={v.email} onChange={set('email')} error={errors.email} autoComplete="email" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Mobile (optional)" type="tel" value={v.mobile} onChange={set('mobile')} error={errors.mobile} autoComplete="tel" />
        <Input label="Current role (optional)" value={v.currentRole} onChange={set('currentRole')} placeholder="e.g. Commis Chef" />
      </div>
      <Textarea label="What would you like to achieve?" rows={3} value={v.message} onChange={set('message')} maxLength={1500} />
      <Button type="submit" className="w-full" size="lg" loading={loading} iconRight={Send}>Send enquiry</Button>
    </form>
  );
}

const MODULES = NAV.slice(1); // Mentoring, Training, Coaching

/** Light, but each module gets its own tint */
const HERO_BG = {
  mentoring: 'bg-[radial-gradient(60rem_40rem_at_85%_10%,rgba(253,186,107,.30),transparent_60%),radial-gradient(50rem_36rem_at_0%_100%,rgba(201,210,243,.6),transparent_60%)] bg-[#fbfbfd]',
  training: 'bg-[radial-gradient(60rem_40rem_at_10%_20%,rgba(201,210,243,.65),transparent_60%),radial-gradient(40rem_30rem_at_100%_100%,rgba(255,237,213,.9),transparent_60%)] bg-[#fbfbfd]',
  coaching: 'bg-[radial-gradient(50rem_40rem_at_75%_50%,rgba(255,237,213,.95),transparent_65%),radial-gradient(40rem_30rem_at_0%_0%,rgba(228,233,250,.9),transparent_60%)] bg-[#fbfbfd]',
};

/** Segmented switcher with a sliding orange indicator */
function ModuleSwitcher({ module }) {
  const idx = Math.max(0, MODULES.findIndex((m) => m.to === `/${module}`));
  return (
    <nav aria-label="Professional development" className="relative inline-grid grid-cols-3 rounded-full bg-white p-1.5 shadow-soft ring-1 ring-navy-100">
      <span
        className="absolute inset-y-1.5 left-1.5 w-[calc((100%-12px)/3)] rounded-full bg-gradient-to-r from-brand-400 to-brand-600 shadow-glow transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
        style={{ transform: `translateX(${idx * 100}%)` }}
        aria-hidden
      />
      {MODULES.map((m) => {
        const on = m.to === `/${module}`;
        return (
          <Link key={m.to} to={m.to} aria-current={on ? 'page' : undefined} className={cx('relative z-10 rounded-full px-5 py-2 text-center text-sm font-semibold transition-colors duration-300', on ? 'text-white' : 'text-navy-500 hover:text-navy-950')}>
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function ProgramPage({ module }) {
  const content = PROGRAM_CONTENT[module];
  const { data, loading } = useApi('/public/programs', { module });
  const programs = data?.programs || [];
  const [selected, setSelected] = useState('');

  const choose = (id) => {
    setSelected(id);
    document.getElementById('enquire')?.scrollIntoView({ behavior: 'smooth' });
  };

  const jsonLd = programs.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: programs.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: { '@type': 'Course', name: p.title, description: p.summary, provider: { '@type': 'Organization', name: 'Hospitality369' } },
        })),
      }
    : undefined;

  return (
    <>
      <Seo jsonLd={jsonLd} />

      {/* ============ HERO (light) – each module has its own visual & layout ============ */}
      <section className={cx('relative isolate overflow-hidden pb-20 pt-28 lg:pt-32', HERO_BG[module])}>
        <div className="hex-pattern-dark absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black_5%,transparent_65%)]" aria-hidden />
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div className={cx(module === 'training' && 'lg:order-2')}>
            <div className="animate-fade-up"><ModuleSwitcher module={module} /></div>
            <h1 className="mt-10 text-[44px] font-semibold leading-[1.02] tracking-[-.045em] text-navy-950 sm:text-[64px] xl:text-[72px]">
              <LineReveal key={module} delay={100} lines={[content.title[0], <span key="t2" className="brand-text">{content.title[1]}</span>]} />
            </h1>
            <p className="mt-6 max-w-md animate-fade-up text-lg text-navy-500 [animation-delay:350ms]">{content.intro}</p>
            <div className="mt-9 flex animate-fade-up flex-wrap gap-3 [animation-delay:450ms]">
              <Magnetic><Button href="#enquire" variant="brand" size="lg" iconRight={ArrowRight}>{content.cta}</Button></Magnetic>
              <Magnetic><Button href="#programmes" variant="outline" size="lg">View programmes</Button></Magnetic>
            </div>
          </div>
          <div key={module} className={cx('hidden animate-fade-up [animation-delay:150ms] md:block', module === 'training' && 'lg:order-1')}>
            <ModuleVisual module={module} content={content} />
          </div>
        </div>
      </section>

      {/* ============ PROGRAMMES (compact) ============ */}
      <section id="programmes" className="scroll-mt-20 bg-white py-24" aria-labelledby="programmes-heading">
        <div className="container-page">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="programmes-heading" className="text-4xl font-semibold tracking-[-.04em] sm:text-5xl">{content.eyebrow} <span className="brand-text">programmes</span></h2>
            <p className="text-sm text-navy-400">Hover a programme for details</p>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {loading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-64 rounded-[28px]" />)}
            {programs.map((p, i) => (
              <Reveal key={p._id} delay={i * 100}>
                <SpotlightCard as="article" className="group card relative flex h-full flex-col overflow-hidden rounded-[28px] p-7 transition duration-500 hover:-translate-y-1.5 hover:shadow-lift">
                  <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-brand-400 to-brand-600 transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
                  <span className="font-display text-sm font-bold text-brand-500">0{i + 1}</span>
                  <h3 className="mt-3 font-display text-2xl font-semibold text-navy-950">{p.title}</h3>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    {p.format && <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-navy-600"><Clock className="h-3.5 w-3.5" aria-hidden />{p.format}</span>}
                    {p.audience && <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-brand-700"><Users className="h-3.5 w-3.5" aria-hidden />{p.audience}</span>}
                  </div>
                  <div className="grid transition-all duration-500 md:grid-rows-[0fr] md:opacity-0 md:group-hover:grid-rows-[1fr] md:group-hover:opacity-100">
                    <p className="overflow-hidden pt-4 text-sm leading-relaxed text-navy-500">{p.summary}</p>
                  </div>
                  <button type="button" onClick={() => choose(p._id)} className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-navy-900 transition-all group-hover:gap-3 group-hover:text-brand-600">
                    Enquire <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </SpotlightCard>
              </Reveal>
            ))}
            {!loading && !programs.length && <p className="text-navy-500">New programmes are launching soon – send us an enquiry to be the first to know.</p>}
          </div>
        </div>
      </section>

      {/* ============ ENQUIRY (light) ============ */}
      <section id="enquire" className="mesh-light scroll-mt-20 py-24" aria-labelledby="enquire-heading">
        <div className="container-page grid items-start gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <Reveal>
            <h2 id="enquire-heading" className="text-4xl font-semibold tracking-[-.04em] sm:text-5xl">{content.cta}</h2>
            <ol className="mt-10 space-y-4">
              {content.steps.map((step, i) => (
                <li key={step} className="group flex items-center gap-4">
                  <span className="hex flex h-12 w-11 shrink-0 items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 font-display text-base font-bold text-white transition-transform duration-500 group-hover:rotate-[30deg]">{i + 1}</span>
                  <span className="text-lg font-semibold text-navy-900 transition-transform duration-300 group-hover:translate-x-1">{step}</span>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={120} className="rounded-[32px] bg-white p-6 shadow-lift ring-1 ring-navy-100 sm:p-10">
            <EnquiryForm module={module} programs={programs} selected={selected} onSelect={setSelected} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
