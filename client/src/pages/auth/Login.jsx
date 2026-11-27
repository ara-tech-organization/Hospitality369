/**
 * Team sign-in – modelled on Google's account sign-in (two-column card,
 * outlined fields with floating labels, pill buttons, footer links).
 */
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import Seo from '../../components/seo/Seo';
import { LogoImage } from '../../components/brand/Logo';
import { PageLoader } from '../../components/ui/Feedback';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../lib/api';
import { cx } from '../../lib/format';

/** Material "outlined" text field with a floating label */
function OutlinedField({ id, label, error, ...props }) {
  return (
    <div className="relative">
      <input
        id={id}
        placeholder=" "
        aria-invalid={error ? 'true' : undefined}
        className={cx(
          'peer block h-14 w-full rounded-[4px] border bg-transparent px-4 pt-1 text-[16px] text-[#1f1f1f] outline-none transition-[border-color,box-shadow]',
          error
            ? 'border-[#b3261e] focus:shadow-[inset_0_0_0_1px_#b3261e]'
            : 'border-[#747775] hover:border-[#1f1f1f] focus:border-brand-600 focus:shadow-[inset_0_0_0_1px_#c0560e]'
        )}
        {...props}
      />
      <label
        htmlFor={id}
        className={cx(
          'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 bg-white px-1 text-[16px] transition-all duration-150',
          'peer-focus:top-0 peer-focus:text-[12px] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-[12px]',
          error ? 'text-[#b3261e]' : 'text-[#444746] peer-focus:text-brand-700'
        )}
      >
        {label}
      </label>
    </div>
  );
}

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <PageLoader />;
  if (user) return <Navigate to={location.state?.from || '/admin'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const fe = {};
    if (!email.trim()) fe.email = 'Enter an email';
    if (!password) fe.password = 'Enter a password';
    setFieldError(fe);
    setError('');
    if (Object.keys(fe).length) return;
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="gdash flex min-h-screen flex-col bg-[#f0f4f9] px-4">
      <Seo title="Sign in | Hospitality369" noindex />

      <main className="flex flex-1 items-center justify-center py-10">
        <div className="relative w-full max-w-[1040px] overflow-hidden rounded-[28px] bg-white p-6 sm:p-9">
          {/* progress bar while signing in, like Google's */}
          <div className={cx('absolute inset-x-0 top-0 h-1 overflow-hidden', submitting ? 'opacity-100' : 'opacity-0')} aria-hidden>
            <div className="h-full w-1/3 animate-[login-progress_1.1s_ease-in-out_infinite] bg-brand-500" />
          </div>

          <form onSubmit={submit} noValidate className="grid gap-8 md:grid-cols-2 md:gap-12">
            {/* left: identity */}
            <div>
              <LogoImage className="h-10" />
              <h1 className="mt-8 text-[36px] font-normal leading-[44px] text-[#1f1f1f]">Sign in</h1>
              <p className="mt-4 text-[16px] text-[#1f1f1f]">to continue to the Hospitality369 dashboard</p>
              <p className="mt-8 hidden max-w-sm items-start gap-3 text-sm leading-relaxed text-[#444746] md:flex">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
                For authorised Hospitality369 staff only. Every sign-in and action is recorded in the audit log.
              </p>
            </div>

            {/* right: fields */}
            <div className="md:pt-24">
              {error && (
                <p className="mb-5 flex items-start gap-2 text-[14px] text-[#b3261e]" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
                </p>
              )}
              <div className="space-y-6">
                <div>
                  <OutlinedField id="email" label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} error={fieldError.email} autoFocus />
                  {fieldError.email && <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#b3261e]"><AlertCircle className="h-3.5 w-3.5" />{fieldError.email}</p>}
                </div>
                <div>
                  <OutlinedField id="password" label="Enter your password" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={fieldError.password} />
                  {fieldError.password && <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#b3261e]"><AlertCircle className="h-3.5 w-3.5" />{fieldError.password}</p>}
                  <label className="mt-3 inline-flex cursor-pointer items-center gap-3 text-[14px] text-[#1f1f1f]">
                    <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="h-[18px] w-[18px] cursor-pointer accent-brand-600" />
                    Show password
                  </label>
                </div>
              </div>

              <p className="mt-6 text-[14px] text-[#444746]">
                Forgotten your password? Ask your Super Admin to reset it from <span className="font-medium text-[#1f1f1f]">Admins &amp; permissions</span>.
              </p>

              <div className="mt-10 flex items-center justify-end gap-2">
                <Link to="/" className="rounded-full px-6 py-2.5 text-[14px] font-medium text-brand-700 transition hover:bg-brand-50">
                  Back to website
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-brand-600 px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-brand-700 hover:shadow-[0_1px_2px_rgba(0,0,0,.3),0_1px_3px_1px_rgba(0,0,0,.15)] disabled:opacity-60"
                >
                  {submitting ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-[1040px] flex-wrap items-center justify-between gap-3 pb-6 text-[12px] text-[#444746]">
        <span className="rounded-md px-2 py-1">English (India)</span>
        <nav className="flex gap-1">
          <a href="/contact" className="rounded-md px-3 py-1.5 hover:bg-black/5">Help</a>
          <a href="/privacy" className="rounded-md px-3 py-1.5 hover:bg-black/5">Privacy</a>
          <a href="/" className="rounded-md px-3 py-1.5 hover:bg-black/5">Website</a>
        </nav>
      </footer>
    </div>
  );
}
