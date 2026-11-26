import { useState } from 'react';
import { Gift, Share2, Trophy, Copy, Search, UserPlus, Crown, Medal, Send, Star } from 'lucide-react';
import Seo from '../../components/seo/Seo';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { Alert, Badge, EmptyState } from '../../components/ui/Feedback';
import { useApi } from '../../hooks/useApi';
import { usePublicConfig } from '../../hooks/usePublicConfig';
import api, { errorMessage, fieldErrors } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { cx, formatDate, formatNumber } from '../../lib/format';
import { REJECTION_REASONS } from '../../lib/constants';
import { Reveal, SpotlightCard, HexIcon } from '../../components/motion';

function CopyLink({ link, code }) {
  const toast = useToast();
  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed – please copy manually');
    }
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Hospitality jobs at Hospitality369', text: 'Apply for hospitality roles with my referral link:', url: link });
      } catch { /* cancelled */ }
    } else copy(link, 'Link');
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl bg-navy-950 px-5 py-4 text-white">
        <div>
          <p className="text-xs text-navy-300">Your referral code</p>
          <p className="mt-0.5 font-mono text-xl font-semibold tracking-wider text-brand-300">{code}</p>
        </div>
        <Button size="sm" variant="light" icon={Copy} onClick={() => copy(code, 'Code')}>Copy</Button>
      </div>
      <div className="flex gap-2">
        <input readOnly value={link} onFocus={(e) => e.target.select()} className="input input-sm flex-1 font-mono text-xs" aria-label="Your referral link" />
        <Button size="sm" icon={Share2} onClick={share}>Share</Button>
      </div>
    </div>
  );
}

function JoinForm() {
  const [v, setV] = useState({ name: '', email: '', mobile: '', website: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const set = (k) => (e) => setV((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (v.name.trim().length < 2) errs.name = 'Enter your full name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) errs.email = 'Enter a valid email address';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/public/referrals/join', v);
      setResult(data.referrer);
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="animate-scale-in space-y-4">
        <Alert tone="success" title={`Welcome aboard, ${result.name.split(' ')[0]}!`}>Save your code – you'll need it with your email to check your points.</Alert>
        <CopyLink link={result.link} code={result.code} />
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <div className="hidden" aria-hidden><input tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} /></div>
      <Input label="Full name" required value={v.name} onChange={set('name')} error={errors.name} autoComplete="name" />
      <Input label="Email" required type="email" value={v.email} onChange={set('email')} error={errors.email} autoComplete="email" />
      <Input label="Mobile (optional)" type="tel" value={v.mobile} onChange={set('mobile')} error={errors.mobile} autoComplete="tel" hint="Used to prevent self-referrals" />
      <Button type="submit" className="w-full" size="lg" loading={loading} icon={UserPlus}>Get my referral link</Button>
    </form>
  );
}

function LookupForm() {
  const [v, setV] = useState({ email: '', code: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!v.email || !v.code) {
      setError('Enter your email and referral code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/public/referrals/lookup', v);
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (data) {
    const r = data.referrer;
    return (
      <div className="animate-scale-in space-y-5">
        <div className="grid grid-cols-3 gap-3">
          {[['Points', r.totalPoints], ['Referrals', r.successfulReferrals], ['Rank', `#${r.rank}`]].map(([l, val]) => (
            <div key={l} className="rounded-2xl bg-brand-50 p-4 text-center ring-1 ring-brand-100">
              <p className="font-display text-2xl text-navy-950">{typeof val === 'number' ? formatNumber(val) : val}</p>
              <p className="text-xs font-semibold text-navy-500">{l}</p>
            </div>
          ))}
        </div>
        <CopyLink link={r.link} code={r.code} />
        <div>
          <h3 className="mb-2 font-sans text-sm font-semibold text-navy-700">Referral history</h3>
          {data.history.length ? (
            <ul className="max-h-64 divide-y divide-navy-100 overflow-y-auto rounded-2xl border border-navy-100 bg-white">
              {data.history.map((h, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy-900">{h.type === 'referral' ? h.candidate : h.reason}</p>
                    <p className="text-xs text-navy-400">
                      {formatDate(h.at)}
                      {h.type === 'referral' && h.status === 'rejected' && ` · ${REJECTION_REASONS[h.reason] || 'Not eligible'}`}
                      {h.type === 'referral' && h.milestones?.length > 0 && ` · ${h.milestones.join(', ')}`}
                      {h.type === 'adjustment' && ' · Manual adjustment'}
                    </p>
                  </div>
                  <Badge tone={h.points > 0 ? 'green' : h.points < 0 ? 'red' : 'slate'}>{h.points > 0 ? '+' : ''}{h.points} pts</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl bg-navy-50 p-4 text-sm text-navy-500">No referrals yet – share your link to get started.</p>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setData(null)}>Check another account</Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <Input label="Email" type="email" required value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} autoComplete="email" />
      <Input label="Referral code" required placeholder="H369-XXXXXX" value={v.code} onChange={(e) => setV({ ...v, code: e.target.value.toUpperCase() })} />
      <Button type="submit" className="w-full" size="lg" loading={loading} icon={Search}>Check my points</Button>
    </form>
  );
}

export default function Referrals() {
  const config = usePublicConfig();
  const { data: lb, loading } = useApi('/public/referrals/leaderboard');
  const [tab, setTab] = useState('join');
  const rules = config?.referral;

  return (
    <>
      <Seo />
      <section className="relative isolate overflow-hidden bg-navy-950 pb-32 pt-36 text-white">
        <div className="hex-pattern absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_75%)]" aria-hidden />
        <div className="absolute -right-32 -top-32 -z-10 h-[34rem] w-[34rem] animate-aurora rounded-full bg-brand-500/30 blur-[120px]" aria-hidden />
        <div className="absolute -bottom-40 -left-20 -z-10 h-96 w-96 animate-aurora rounded-full bg-navy-500/40 blur-[120px] [animation-delay:-6s]" aria-hidden />
        <div className="container-page relative max-w-4xl text-center">
          <span className="mx-auto block w-fit animate-float"><HexIcon icon={Gift} tone="brand" size="lg" className="shadow-glow-lg" /></span>
          <h1 className="mt-8 animate-fade-up text-[42px] font-semibold leading-[1.04] text-white sm:text-6xl lg:text-7xl">Refer great people. <span className="brand-text">Earn points.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-navy-200">Share your personal link with chefs, bartenders, front office stars and hospitality managers. Every successful step they take earns you points.</p>
          {rules && !rules.enabled && <p className="mx-auto mt-6 max-w-md rounded-xl bg-white/10 px-4 py-3 text-sm text-brand-200">The referral programme is currently paused. Existing points are safe.</p>}
        </div>
      </section>

      <section className="container-page relative z-10 -mt-16 grid gap-4 sm:grid-cols-3" aria-label="How points are earned">
        {[
          [Send, 'They apply', rules?.pointsOnApplication],
          [Star, 'They get shortlisted', rules?.pointsOnShortlist],
          [Crown, 'They get hired', rules?.pointsOnHire],
        ].map(([Icon, label, pts], i) => (
          <Reveal key={label} delay={i * 100}>
            <SpotlightCard className="group card relative h-full rounded-3xl p-7 text-center shadow-lift transition duration-500 hover:-translate-y-1.5">
              <HexIcon icon={Icon} tone={i === 2 ? 'brand' : 'navy'} className="mx-auto group-hover:rotate-[30deg]" />
              <p className="mt-5 font-display text-5xl font-bold text-navy-950">+{pts ?? '—'}</p>
              <p className="mt-1 text-sm font-semibold text-navy-500">{label}</p>
            </SpotlightCard>
          </Reveal>
        ))}
      </section>

      <section className="container-page grid gap-8 py-20 lg:grid-cols-[1.1fr_1fr]">
        <div className="card rounded-3xl p-6 shadow-lift sm:p-8">
          <div className="mb-7 inline-flex rounded-2xl bg-navy-50 p-1" role="tablist">
            {[['join', 'Join the programme'], ['lookup', 'Check my points']].map(([k, l]) => (
              <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('rounded-xl px-4 py-2 text-sm font-semibold transition', tab === k ? 'bg-white text-navy-950 shadow-soft' : 'text-navy-500 hover:text-navy-800')}>
                {l}
              </button>
            ))}
          </div>
          {tab === 'join' ? (rules && !rules.enabled ? <Alert tone="info">New sign-ups are paused at the moment.</Alert> : <JoinForm />) : <LookupForm />}
          <p className="mt-6 text-xs leading-relaxed text-navy-400">
            Fair-play rules: self-referrals don't earn points, each candidate can only be credited to one referrer, and daily limits apply. Points for each milestone are awarded once.
          </p>
        </div>

        <div className="card overflow-hidden rounded-3xl shadow-lift">
          <div className="flex items-center gap-3 border-b border-navy-100 px-6 py-5">
            <Trophy className="h-5 w-5 text-brand-500" aria-hidden />
            <h2 className="font-sans text-lg font-semibold">Leaderboard</h2>
          </div>
          {loading ? (
            <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10" />)}</div>
          ) : lb?.leaderboard?.length ? (
            <ol className="divide-y divide-navy-100">
              {lb.leaderboard.map((r) => (
                <li key={r.rank} className="flex items-center gap-4 px-6 py-3.5">
                  <span className={cx('flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold', r.rank === 1 ? 'bg-gradient-to-br from-brand-300 to-brand-500 text-navy-950' : r.rank <= 3 ? 'bg-navy-950 text-brand-300' : 'bg-navy-50 text-navy-500')}>
                    {r.rank <= 3 ? <Medal className="h-4 w-4" aria-label={`Rank ${r.rank}`} /> : r.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-navy-900">{r.name}</p>
                    <p className="text-xs text-navy-400">{r.referrals} referral{r.referrals === 1 ? '' : 's'}</p>
                  </div>
                  <p className="font-display text-lg text-navy-950">{formatNumber(r.points)} <span className="font-sans text-xs text-navy-400">pts</span></p>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon={Trophy} title="Be the first on the board" description="Join today and start referring hospitality talent." />
          )}
        </div>
      </section>
    </>
  );
}
