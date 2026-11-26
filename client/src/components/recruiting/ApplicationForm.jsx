import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Send, CheckCircle2, Copy, Gift, RotateCcw, Tag } from 'lucide-react';
import api, { errorMessage, fieldErrors } from '../../lib/api';
import { INDUSTRY_LABEL } from '../../lib/constants';
import { Input, Select, Checkbox } from '../ui/Form';
import { Alert } from '../ui/Feedback';
import FileDrop from '../ui/FileDrop';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';

const EMPTY = { fullName: '', email: '', mobile: '', role: '', position: '', referralCode: '', consent: false, website: '' };
const NAME_RX = /^[\p{L}\p{M}' .-]+$/u;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_RX = /^\+?[0-9 ()-]{7,20}$/;

/** Mirrors the server rules for instant feedback (server remains the source of truth) */
function validate(v, file, role) {
  const e = {};
  if (!v.fullName.trim() || v.fullName.trim().length < 2) e.fullName = 'Enter your full name';
  else if (!NAME_RX.test(v.fullName.trim())) e.fullName = 'Name can only contain letters, spaces, apostrophes and hyphens';
  if (!v.email.trim()) e.email = 'Email is required';
  else if (!EMAIL_RX.test(v.email.trim())) e.email = 'Enter a valid email address';
  const digits = v.mobile.replace(/\D/g, '').length;
  if (!v.mobile.trim()) e.mobile = 'Mobile number is required';
  else if (!MOBILE_RX.test(v.mobile.trim()) || digits < 8 || digits > 15) e.mobile = 'Enter a valid mobile number (8–15 digits)';
  if (!v.role) e.role = 'Select the role you are applying for';
  if (!v.position.trim()) e.position = role?.positions?.length ? 'Select a position' : 'Enter the position';
  if (!file) e.resume = 'Please attach your CV/Resume';
  if (!v.consent) e.consent = 'Please accept the privacy notice to continue';
  return e;
}

/**
 * Props:
 *  - selectRole: { id, nonce } – lets the page pre-select a role (e.g. from a role chip)
 *  - onProgress: ({ personal, role, cv, consent, submitted }) – live completion for a stepper
 */
export default function ApplicationForm({ initialRole, initialRef, maxMb = 5, accepting = true, selectRole, onProgress }) {
  const toast = useToast();
  const [values, setValues] = useState({ ...EMPTY, role: initialRole || '', referralCode: initialRef || '' });
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [formError, setFormError] = useState('');
  const [result, setResult] = useState(null);
  const [referrer, setReferrer] = useState(null);
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState('');

  const loadRoles = () => {
    setRolesLoading(true);
    setRolesError('');
    api
      .get('/public/roles')
      .then((r) => setRoles(r.data.roles))
      .catch((err) => setRolesError(errorMessage(err, 'Could not load roles')))
      .finally(() => setRolesLoading(false));
  };
  useEffect(loadRoles, []);

  // External role selection (role chips on the page)
  useEffect(() => {
    if (selectRole?.id) {
      setValues((v) => (v.role === selectRole.id ? v : { ...v, role: selectRole.id, position: '' }));
      setResult(null);
    }
  }, [selectRole]);

  // Report completion for the page's application journey
  useEffect(() => {
    if (!onProgress) return;
    const digits = values.mobile.replace(/\D/g, '').length;
    onProgress({
      personal: values.fullName.trim().length >= 2 && EMAIL_RX.test(values.email.trim()) && digits >= 8 && digits <= 15,
      role: Boolean(values.role && values.position.trim()),
      cv: Boolean(file),
      consent: values.consent,
      submitted: Boolean(result),
    });
  }, [values, file, result, onProgress]);

  const role = useMemo(() => roles.find((r) => r._id === values.role), [roles, values.role]);
  const grouped = useMemo(() => {
    const g = {};
    roles.forEach((r) => {
      (g[r.industry] ||= []).push(r);
    });
    return g;
  }, [roles]);

  // If a deep-linked role is no longer available, clear it
  useEffect(() => {
    if (!rolesLoading && values.role && !role) setValues((v) => ({ ...v, role: '', position: '' }));
  }, [rolesLoading, role, values.role]);

  // Validate referral code against the API
  useEffect(() => {
    const code = values.referralCode.trim();
    if (code.length < 6) {
      setReferrer(null);
      return undefined;
    }
    const t = setTimeout(() => {
      api
        .get(`/public/referrals/validate/${encodeURIComponent(code)}`)
        .then((r) => setReferrer(r.data.valid ? { name: r.data.referrer } : { invalid: true }))
        .catch(() => setReferrer(null));
    }, 400);
    return () => clearTimeout(t);
  }, [values.referralCode]);

  const set = (key) => (e) => {
    const value = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setValues((v) => {
      const next = { ...v, [key]: value };
      if (key === 'role') next.position = '';
      if (touched[key]) setErrors(validate(next, file, roles.find((r) => r._id === next.role)));
      return next;
    });
  };
  const blur = (key) => () => {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: validate(values, file, role)[key] }));
  };
  const shown = (key) => (touched[key] || touched._submit ? errors[key] : undefined);

  const onFile = (f) => {
    setFile(f);
    setUploadStatus('idle');
    setProgress(0);
    setErrors((prev) => ({ ...prev, resume: f ? undefined : prev.resume }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return; // guard against double submission
    setFormError('');
    const errs = validate(values, file, role);
    setErrors(errs);
    setTouched((t) => ({ ...t, _submit: true }));
    if (Object.keys(errs).length) {
      const first = document.querySelector('[aria-invalid="true"]');
      first?.focus();
      return;
    }

    const fd = new FormData();
    Object.entries({ ...values, consent: String(values.consent) }).forEach(([k, v]) => fd.append(k, typeof v === 'string' ? v.trim() : v));
    fd.append('resume', file);

    setSubmitting(true);
    setUploadStatus('uploading');
    try {
      const { data } = await api.post('/public/applications', fd, {
        onUploadProgress: (p) => p.total && setProgress(Math.round((p.loaded / p.total) * 100)),
      });
      setProgress(100);
      setUploadStatus('done');
      setResult(data);
      toast.success('Application submitted successfully');
      sessionStorage.removeItem('h369_ref');
      window.scrollTo({ top: document.getElementById('apply')?.offsetTop - 100 || 0, behavior: 'smooth' });
    } catch (err) {
      setUploadStatus('error');
      const fields = fieldErrors(err);
      if (Object.keys(fields).length) setErrors((prev) => ({ ...prev, ...fields }));
      setFormError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setValues({ ...EMPTY });
    setFile(null);
    setErrors({});
    setTouched({});
    setUploadStatus('idle');
    setProgress(0);
    setResult(null);
    setFormError('');
  };

  if (result) {
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(result.myReferral.link);
        toast.success('Referral link copied');
      } catch {
        toast.error('Could not copy – please copy it manually');
      }
    };
    return (
      <div className="animate-scale-in text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden />
        </div>
        <h2 className="mt-6 text-3xl font-medium">Application received</h2>
        <p className="mx-auto mt-3 max-w-md text-navy-500">{result.message} Our hospitality recruitment team will review it and contact you by email or phone.</p>
        <dl className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-3 text-left">
          <div className="rounded-2xl bg-navy-50 p-4"><dt className="text-xs text-navy-400">Reference</dt><dd className="mt-1 font-mono text-sm font-semibold text-navy-900">{result.application.reference}</dd></div>
          <div className="rounded-2xl bg-navy-50 p-4"><dt className="text-xs text-navy-400">Role</dt><dd className="mt-1 truncate text-sm font-semibold text-navy-900">{result.application.position}</dd></div>
        </dl>
        {result.referralApplied && <p className="mt-4 text-sm font-medium text-emerald-700">Your referral has been credited – thank you!</p>}

        {result.myReferral?.code && (
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-brand-200 bg-brand-50 p-5 text-left">
            <p className="flex items-center gap-2 text-sm font-semibold text-navy-900"><Gift className="h-4 w-4 text-brand-600" aria-hidden /> Refer friends & earn points</p>
            <p className="mt-1 text-xs text-navy-500">Your personal code is <span className="font-mono font-semibold text-navy-900">{result.myReferral.code}</span>. Keep it safe – you'll need it with your email to check your points.</p>
            <div className="mt-3 flex gap-2">
              <input readOnly value={result.myReferral.link} className="input input-sm flex-1 font-mono text-xs" aria-label="Your referral link" onFocus={(e) => e.target.select()} />
              <Button size="sm" variant="primary" icon={Copy} onClick={copy}>Copy</Button>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="outline" icon={RotateCcw} onClick={reset}>Apply for another role</Button>
          <Button to="/training" variant="ghost">Explore training</Button>
        </div>
      </div>
    );
  }

  if (!accepting) {
    return <Alert tone="info" title="Applications are paused">We're not accepting new applications right now. Please check back soon.</Alert>;
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5" aria-describedby={formError ? 'form-error' : undefined}>
      {formError && <Alert tone="error" title="We couldn't submit your application"><span id="form-error">{formError}</span></Alert>}

      {/* Honeypot – hidden from humans */}
      <div className="hidden" aria-hidden>
        <label>Website<input tabIndex={-1} autoComplete="off" value={values.website} onChange={set('website')} /></label>
      </div>

      <Input label="Full name" required icon={User} autoComplete="name" placeholder="e.g. Priya Raman" value={values.fullName} onChange={set('fullName')} onBlur={blur('fullName')} error={shown('fullName')} maxLength={100} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Email address" required type="email" icon={Mail} autoComplete="email" inputMode="email" placeholder="you@example.com" value={values.email} onChange={set('email')} onBlur={blur('email')} error={shown('email')} maxLength={254} />
        <Input label="Mobile number" required type="tel" icon={Phone} autoComplete="tel" inputMode="tel" placeholder="+91 98765 43210" value={values.mobile} onChange={set('mobile')} onBlur={blur('mobile')} error={shown('mobile')} maxLength={20} hint="Include your country code" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Role applying for"
          required
          value={values.role}
          onChange={set('role')}
          onBlur={blur('role')}
          error={shown('role') || rolesError}
          disabled={rolesLoading || !!rolesError}
          placeholder={rolesLoading ? 'Loading roles…' : roles.length ? 'Select a role' : 'No roles open right now'}
        >
          {Object.entries(grouped).map(([industry, list]) => (
            <optgroup key={industry} label={INDUSTRY_LABEL[industry] || industry}>
              {list.map((r) => <option key={r._id} value={r._id}>{r.title}</option>)}
            </optgroup>
          ))}
        </Select>

        {role?.positions?.length ? (
          <Select label="Position" required value={values.position} onChange={set('position')} onBlur={blur('position')} error={shown('position')} placeholder="Select a position">
            {role.positions.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        ) : (
          <Input label="Position" required placeholder={values.role ? 'e.g. Senior / Supervisor' : 'Select a role first'} disabled={!values.role} value={values.position} onChange={set('position')} onBlur={blur('position')} error={shown('position')} maxLength={80} />
        )}
      </div>
      {rolesError && <button type="button" onClick={loadRoles} className="text-sm font-semibold text-brand-700 underline">Retry loading roles</button>}
      {role?.description && <p className="-mt-2 rounded-xl bg-navy-50/70 px-4 py-3 text-[13px] text-navy-500">{role.description}</p>}

      <FileDrop file={file} onChange={onFile} error={shown('resume')} maxMb={maxMb} status={uploadStatus} progress={progress} disabled={submitting} />

      <Input
        label="Referral code (optional)"
        icon={Tag}
        placeholder="H369-XXXXXX"
        value={values.referralCode}
        onChange={(e) => set('referralCode')(e.target.value.toUpperCase())}
        maxLength={20}
        hint={referrer?.name ? `✓ Referred by ${referrer.name}` : referrer?.invalid ? 'This code was not recognised – you can still apply' : 'Were you referred by someone? Enter their code.'}
      />

      <Checkbox checked={values.consent} onChange={(c) => { set('consent')(c); setTouched((t) => ({ ...t, consent: true })); }} error={shown('consent')}>
        I agree that Hospitality369 may store and process my details and CV for recruitment purposes, as described in the{' '}
        <Link to="/privacy" className="font-semibold text-navy-900 underline decoration-brand-300 underline-offset-2">privacy notice</Link>.
      </Checkbox>

      <Button type="submit" variant="primary" size="lg" className="w-full" loading={submitting} iconRight={submitting ? undefined : Send}>
        {submitting ? (progress < 100 ? `Uploading… ${progress}%` : 'Submitting…') : 'Submit application'}
      </Button>
      <p className="text-center text-xs text-navy-400">Your CV is stored privately and only accessible to authorised recruiters.</p>
    </form>
  );
}
