import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import Seo from '../../components/seo/Seo';
import Logo from '../../components/brand/Logo';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { Alert, PageLoader } from '../../components/ui/Feedback';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../lib/api';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <PageLoader />;
  if (user) return <Navigate to={location.state?.from || '/admin'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Enter your email and password');
      return;
    }
    setSubmitting(true);
    setError('');
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
    <div className="grid min-h-screen lg:grid-cols-2">
      <Seo title="Team sign in | Hospitality369" noindex />
      <div className="relative hidden overflow-hidden bg-navy-950 p-12 text-white lg:flex lg:flex-col">
        <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(ellipse_at_bottom_left,black_20%,transparent_70%)]" aria-hidden />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-500/25 blur-[120px]" aria-hidden />
        <Logo onDark className="relative w-fit" />
        <div className="relative mt-auto max-w-md">
          <h2 className="text-5xl font-medium leading-tight text-white">Recruitment, <span className="brand-text">beautifully</span> managed.</h2>
          <p className="mt-5 text-navy-300">Candidates, roles, referrals and analytics for hospitality hiring – in one secure workspace.</p>
          <p className="mt-10 flex items-center gap-2 text-sm text-navy-400"><ShieldCheck className="h-4 w-4 text-brand-400" aria-hidden /> Role-based access · every action audited</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-mist px-6 py-16">
        <div className="w-full max-w-sm animate-fade-up">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-4xl font-medium">Welcome back</h1>
          <p className="mt-2 text-navy-500">Sign in to the Hospitality369 dashboard.</p>
          <form onSubmit={submit} noValidate className="mt-8 space-y-5">
            {error && <Alert>{error}</Alert>}
            <Input label="Email" type="email" icon={Mail} autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <div className="relative">
              <Input label="Password" type={show ? 'text' : 'password'} icon={Lock} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required inputClassName="pr-11" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute bottom-3 right-3 text-navy-400 hover:text-navy-700" aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <Button type="submit" size="lg" className="w-full" loading={submitting} icon={LogIn}>Sign in</Button>
          </form>
          <p className="mt-8 text-center text-xs text-navy-400">Access is restricted to authorised Hospitality369 staff.</p>
        </div>
      </div>
    </div>
  );
}
