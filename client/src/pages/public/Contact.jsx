import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, Mail, MapPin, Copy, Check, ArrowUpRight, ArrowRight, Send, Navigation, Clock3, RotateCcw, User, Building2, ShieldCheck,
  Users, Briefcase, Compass, GraduationCap, Target, Lightbulb, Store, PartyPopper, MessageCircle,
} from 'lucide-react';
import Seo from '../../components/seo/Seo';
import Button from '../../components/ui/Button';
import Index from '../../components/ui/SectionIndex';
import { Reveal, LineReveal, Magnetic, HexIcon } from '../../components/motion';
import { usePublicConfig } from '../../hooks/usePublicConfig';
import { useToast } from '../../context/ToastContext';
import api, { errorMessage, fieldErrors } from '../../lib/api';
import { cx } from '../../lib/format';
import { COMPANY } from '../../content/site';

const FALLBACK_TOPICS = ['Hiring staff', 'Finding a job', 'Mentoring', 'Training', 'Coaching', 'Consulting', 'Franchise', 'Catering & events', 'Something else'];
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Live local time in Chennai */
function useChennaiTime() {
  const fmt = () => new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }).format(new Date());
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 20000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/* ------------------------------ contact channel ------------------------------ */

function Channel({ icon, label, value, href, external, copy }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(copy);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy – please copy it manually');
    }
  };
  return (
    <div className="group relative flex items-center gap-4 rounded-3xl border border-white/10 p-4 transition-all duration-500 hover:border-brand-400/40 hover:bg-white/[.05] sm:p-5">
      <HexIcon icon={icon} tone="brand" className="group-hover:rotate-[30deg]" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-navy-300">{label}</p>
        <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="mt-1 block font-display text-lg font-semibold leading-snug text-white transition-colors hover:text-brand-300 sm:text-xl">
          {value}
        </a>
      </div>
      {copy && (
        <button type="button" onClick={doCopy} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-navy-200 transition hover:border-white hover:bg-white hover:text-navy-950" aria-label={`Copy ${label.toLowerCase()}`}>
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
      )}
      <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-500 group-hover:rotate-45 group-hover:bg-brand-500" aria-label={`Open ${label.toLowerCase()}`}>
        <ArrowUpRight className="h-4 w-4" />
      </a>
    </div>
  );
}

/* ---------------------------- conversational form ---------------------------- */

/** Floating-label field: the label sits inside the box and lifts when focused/filled */
function FloatField({ id, label, error, required, icon: Icon, textarea, className, ...props }) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className={className}>
      <div className="group relative">
        {Icon && <Icon className={cx('pointer-events-none absolute left-4 h-4 w-4 transition-colors', textarea ? 'top-5' : 'top-1/2 -translate-y-1/2', error ? 'text-coral-400' : 'text-navy-300 group-focus-within:text-brand-500')} aria-hidden />}
        <Tag
          id={id}
          placeholder=" "
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          aria-required={required || undefined}
          className={cx(
            'peer block w-full rounded-2xl border bg-white/90 pb-2.5 pr-4 pt-6 text-[15px] text-navy-900 shadow-[inset_0_1px_2px_rgba(11,16,48,.04)] transition-all duration-300 focus:outline-none',
            Icon ? 'pl-11' : 'pl-4',
            textarea && 'min-h-[150px] resize-none',
            error ? 'border-coral-300 focus:border-coral-400 focus:ring-4 focus:ring-coral-400/15' : 'border-navy-100 hover:border-navy-200 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100'
          )}
          {...props}
        />
        <label
          htmlFor={id}
          className={cx(
            'pointer-events-none absolute text-navy-400 transition-all duration-200',
            Icon ? 'left-11' : 'left-4',
            textarea ? 'top-5 text-[15px]' : 'top-1/2 -translate-y-1/2 text-[15px]',
            'peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-[.12em] peer-focus:text-brand-600',
            'peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-[.12em]'
          )}
        >
          {label}{required && <span className="text-coral-500"> *</span>}
        </label>
      </div>
      {error && <p id={`${id}-err`} className="mt-1.5 pl-1 text-[13px] font-medium text-coral-600" role="alert">{error}</p>}
    </div>
  );
}

const TOPIC_ICONS = {
  'Hiring staff': Users,
  'Finding a job': Briefcase,
  Mentoring: Compass,
  Training: GraduationCap,
  Coaching: Target,
  Consulting: Lightbulb,
  Franchise: Store,
  'Catering & events': PartyPopper,
  'Something else': MessageCircle,
};

function ContactForm({ topics }) {
  const toast = useToast();
  const EMPTY_FORM = { name: '', company: '', topic: '', email: '', mobile: '', message: '', website: '' };
  const [v, setV] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');
  const set = (k) => (e) => {
    const value = e.target.value;
    setV((x) => ({ ...x, [k]: value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (v.name.trim().length < 2) errs.name = 'Tell us your name';
    if (!EMAIL_RX.test(v.email.trim())) errs.email = 'Enter a valid email address';
    if (v.mobile && v.mobile.replace(/\D/g, '').length < 8) errs.mobile = 'Enter a valid phone number';
    if (!v.topic) errs.topic = 'Choose what you would like to talk about';
    if (v.message.trim().length < 10) errs.message = 'Tell us a little more (at least 10 characters)';
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.querySelector('#contact-form [aria-invalid="true"], #contact-form [data-topic-error]')?.focus();
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/public/contact', v);
      setDone(data.message);
      toast.success('Message sent');
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-[520px] animate-scale-in flex-col items-center justify-center text-center">
        <span className="relative flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-300/50" aria-hidden />
          <span className="hex relative flex h-24 w-[84px] items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow-lg"><Check className="h-10 w-10" /></span>
        </span>
        <h2 className="mt-8 text-4xl font-semibold tracking-[-.03em]">Message sent.</h2>
        <p className="mt-3 max-w-sm text-navy-500">{done}</p>
        <Button variant="outline" className="mt-8" icon={RotateCcw} onClick={() => { setDone(''); setV(EMPTY_FORM); }}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form id="contact-form" onSubmit={submit} noValidate>
      <div className="hidden" aria-hidden><input tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} /></div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-[-.03em]">Send us a message</h2>
          <p className="mt-1.5 text-sm text-navy-400">Fields marked <span className="text-coral-500">*</span> are required.</p>
        </div>
        <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 sm:flex"><Send className="h-5 w-5" aria-hidden /></span>
      </div>

      {/* 1 – about you */}
      <p className="mb-3 mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-navy-400"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-950 text-[10px] text-white">1</span> About you</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FloatField id="c-name" label="Full name" required icon={User} value={v.name} onChange={set('name')} error={errors.name} autoComplete="name" maxLength={100} />
        <FloatField id="c-company" label="Company / hotel (optional)" icon={Building2} value={v.company} onChange={set('company')} autoComplete="organization" maxLength={120} />
        <FloatField id="c-email" label="Email address" required icon={Mail} type="email" inputMode="email" value={v.email} onChange={set('email')} error={errors.email} autoComplete="email" />
        <FloatField id="c-mobile" label="Phone (optional)" icon={Phone} type="tel" inputMode="tel" value={v.mobile} onChange={set('mobile')} error={errors.mobile} autoComplete="tel" maxLength={20} />
      </div>

      {/* 2 – topic */}
      <fieldset className="mt-8">
        <legend className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-navy-400"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-950 text-[10px] text-white">2</span> What&apos;s it about? <span className="text-coral-500">*</span></legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" data-topic-error={errors.topic ? '' : undefined} tabIndex={errors.topic ? -1 : undefined}>
          {topics.map((t) => {
            const on = v.topic === t;
            const Icon = TOPIC_ICONS[t] || MessageCircle;
            return (
              <label
                key={t}
                className={cx(
                  'group relative flex cursor-pointer items-center gap-2.5 rounded-2xl border p-3 text-sm font-semibold transition-all duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-400',
                  on ? 'border-brand-400 bg-gradient-to-br from-brand-50 to-white text-navy-950 shadow-soft' : errors.topic ? 'border-coral-300 bg-white text-navy-600' : 'border-navy-100 bg-white text-navy-600 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-soft'
                )}
              >
                <input type="radio" name="topic" value={t} checked={on} onChange={set('topic')} className="sr-only" />
                <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-300', on ? 'bg-gradient-to-br from-brand-400 to-brand-600 text-white' : 'bg-navy-50 text-navy-500 group-hover:text-brand-600')}>
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="leading-tight">{t}</span>
                {on && <Check className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-brand-600" aria-hidden />}
              </label>
            );
          })}
        </div>
        {errors.topic && <p className="mt-1.5 pl-1 text-[13px] font-medium text-coral-600" role="alert">{errors.topic}</p>}
      </fieldset>

      {/* 3 – message */}
      <p className="mb-3 mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-navy-400"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-950 text-[10px] text-white">3</span> Your message</p>
      <FloatField id="c-message" label="How can we help?" required textarea value={v.message} onChange={set('message')} error={errors.message} maxLength={1500} />
      <p className={cx('mt-1.5 text-right text-xs tabular-nums', v.message.length > 1400 ? 'text-coral-500' : 'text-navy-300')}>{v.message.length} / 1500</p>

      <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-4 border-t border-navy-100 pt-6 sm:flex-row sm:items-center">
        <p className="flex items-center gap-2 text-sm text-navy-400"><ShieldCheck className="h-4 w-4 text-brand-500" aria-hidden /> Only used to reply to you.</p>
        <Magnetic><Button type="submit" variant="brand" size="lg" loading={loading} iconRight={Send} className="w-full sm:w-auto">Send message</Button></Magnetic>
      </div>
    </form>
  );
}

/* ----------------------------------- page ----------------------------------- */

export default function Contact() {
  const config = usePublicConfig();
  const time = useChennaiTime();
  const phone = config?.contact?.contactPhone || COMPANY.phone;
  const email = config?.contact?.contactEmail;
  const address = config?.contact?.address || COMPANY.address;
  const topics = config?.contactTopics || FALLBACK_TOPICS;
  const mapQuery = encodeURIComponent(`${address}, India`);

  return (
    <>
      <Seo />

      {/* ============ SPLIT: channels (dark) + conversational form (light) ============ */}
      <section className="grid min-h-screen pt-[72px] lg:grid-cols-[.92fr_1.08fr]">
        {/* left */}
        <div className="relative isolate overflow-hidden bg-navy-950 px-5 py-16 text-white sm:px-10 lg:px-14 lg:py-20">
          <div className="hex-pattern absolute inset-0 -z-10" aria-hidden />
          <div className="absolute -bottom-40 -left-32 -z-10 h-[30rem] w-[30rem] animate-aurora rounded-full bg-brand-500/30 blur-[120px]" aria-hidden />
          {/* Content is spread over the full panel height, so there is no empty block when the form beside it is taller */}
          <div className="ml-auto flex h-full max-w-xl flex-col justify-between gap-10">
            <div>
            <Index n="✦" label="Contact" dark />
            <h1 className="mt-8 text-[52px] font-semibold leading-[.98] tracking-[-.045em] text-white sm:text-7xl">
              <LineReveal delay={80} lines={["Let's talk", <span key="h" className="brand-text">hospitality.</span>]} />
            </h1>

            <p className="mt-8 inline-flex animate-fade-up items-center gap-3 rounded-full border border-white/10 bg-white/[.05] py-2 pl-3 pr-4 text-sm text-navy-100 [animation-delay:300ms]">
              <span className="relative flex h-2.5 w-2.5" aria-hidden>
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-400" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <Clock3 className="h-4 w-4 text-brand-300" aria-hidden />
              It&apos;s <strong className="font-semibold text-white">{time}</strong> in Chennai
            </p>
            </div>

            <ul className="space-y-3">
              <Reveal as="li"><Channel icon={Phone} label="Call" value={phone} href={`tel:${phone.replace(/\s/g, '')}`} copy={phone} /></Reveal>
              {email && <Reveal as="li" delay={90}><Channel icon={Mail} label="Email" value={email} href={`mailto:${email}`} copy={email} /></Reveal>}
              <Reveal as="li" delay={180}><Channel icon={MapPin} label="Visit" value={address} href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} external copy={address} /></Reveal>
            </ul>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/[.04] p-5">
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-navy-300">Office hours</p>
                <p className="mt-2 font-display text-lg font-semibold text-white">Mon – Sat</p>
                <p className="text-sm text-navy-200">9:30 am – 6:30 pm IST</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[.04] p-5">
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-navy-300">We serve</p>
                <p className="mt-2 font-display text-lg font-semibold text-white">Hotels · Restaurants</p>
                <p className="text-sm text-navy-200">Bars · Banquet halls</p>
              </div>
            </div>

            <Link to="/recruiting" className="group flex items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 p-5 shadow-glow-lg transition hover:-translate-y-1">
              <span>
                <span className="block text-sm text-white/85">Looking for a job?</span>
                <span className="font-display text-xl font-semibold text-white">Apply in about 3 minutes</span>
              </span>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-600 transition-transform duration-500 group-hover:rotate-[-45deg]"><ArrowRight className="h-5 w-5" /></span>
            </Link>
          </div>
        </div>

        {/* right */}
        <div className="mesh-light relative px-5 py-16 sm:px-10 lg:px-14 lg:py-20">
          <div className="max-w-2xl">
                        <div className="relative rounded-[36px] bg-white/85 p-6 shadow-lift ring-1 ring-white backdrop-blur-xl sm:p-10">
              <span className="absolute inset-x-12 -top-px h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent" aria-hidden />
              <ContactForm topics={topics} />
            </div>
          </div>
        </div>
      </section>

      {/* ============ MAP ============ */}
      <section className="bg-white px-5 py-20 sm:px-8" aria-label="Our location">
        <div className="group relative mx-auto h-[460px] max-w-7xl overflow-hidden rounded-[40px] bg-navy-100 shadow-lift ring-1 ring-navy-100">
          <iframe
            title="Hospitality369 office location"
            src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full w-full border-0 grayscale-[85%] contrast-[1.05] transition-all duration-700 group-hover:grayscale-0"
          />
          <div className="pointer-events-none absolute inset-0 rounded-[40px] ring-1 ring-inset ring-black/5" aria-hidden />
          <div className="absolute bottom-5 left-5 right-5 max-w-sm rounded-3xl bg-navy-950/95 p-6 text-white shadow-2xl backdrop-blur sm:bottom-8 sm:left-8 sm:right-auto">
            <div className="flex items-start gap-4">
              <HexIcon icon={MapPin} tone="brand" size="sm" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.18em] text-brand-300">Our office</p>
                <p className="mt-1 font-semibold leading-snug">{address}</p>
              </div>
            </div>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy-950 transition-all hover:gap-3 hover:bg-brand-500 hover:text-white">
              <Navigation className="h-4 w-4" aria-hidden /> Get directions
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
