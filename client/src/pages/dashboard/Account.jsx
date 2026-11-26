import { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api, { errorMessage, fieldErrors } from '../../lib/api';
import { PageHeader, Card } from '../../components/ui/Data';
import { Input } from '../../components/ui/Form';
import { Alert, Badge } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';

export default function Account() {
  const { user, catalog, isSuperAdmin } = useAuth();
  const toast = useToast();
  const [v, setV] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!v.currentPassword) errs.currentPassword = 'Enter your current password';
    if (!(v.newPassword.length >= 10 && /[a-z]/.test(v.newPassword) && /[A-Z]/.test(v.newPassword) && /\d/.test(v.newPassword))) errs.newPassword = 'At least 10 characters with upper & lowercase letters and a number';
    if (v.newPassword !== v.confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/auth/change-password', { currentPassword: v.currentPassword, newPassword: v.newPassword });
      toast.success(data.message);
      setV({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const labels = Object.fromEntries(catalog.map((c) => [c.key, c.label]));

  return (
    <>
      <PageHeader eyebrow="Account" title="Your account" description={`${user.name} · ${user.email}`} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-brand-600" aria-hidden />Change password</span>} description="Changing your password signs out your other sessions.">
          <form onSubmit={submit} noValidate className="space-y-4">
            {error && <Alert>{error}</Alert>}
            <Input label="Current password" type="password" autoComplete="current-password" value={v.currentPassword} onChange={(e) => setV({ ...v, currentPassword: e.target.value })} error={errors.currentPassword} />
            <Input label="New password" type="password" autoComplete="new-password" value={v.newPassword} onChange={(e) => setV({ ...v, newPassword: e.target.value })} error={errors.newPassword} />
            <Input label="Confirm new password" type="password" autoComplete="new-password" value={v.confirm} onChange={(e) => setV({ ...v, confirm: e.target.value })} error={errors.confirm} />
            <Button type="submit" loading={saving}>Update password</Button>
          </form>
        </Card>
        <Card title={<span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden />Your access</span>} description={isSuperAdmin ? 'Super Admin – full access' : 'Granted by your Super Admin'}>
          <div className="flex flex-wrap gap-2">
            {user.permissions.length ? user.permissions.map((p) => <Badge key={p} tone="brand">{labels[p] || p}</Badge>) : <p className="text-sm text-navy-500">You have no module permissions yet. Contact your Super Admin.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
