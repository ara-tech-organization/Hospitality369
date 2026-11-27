import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserPlus, ShieldCheck, KeyRound, Trash2, Crown, Check } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api, { errorMessage, fieldErrors } from '../../lib/api';
import { formatDateTime, initials, cx } from '../../lib/format';
import { PageHeader } from '../../components/ui/Data';
import { Input, Toggle } from '../../components/ui/Form';
import { Alert, Badge, Skeleton } from '../../components/ui/Feedback';
import { Modal, ConfirmDialog } from '../../components/ui/Overlay';
import Button from '../../components/ui/Button';
import { useLiveRefresh } from '../../context/RealtimeContext';

const PASSWORD_HINT = 'At least 10 characters with upper & lowercase letters and a number';

function PermissionPicker({ catalog, value, onChange }) {
  const toggle = (key) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label mb-0">Permissions</span>
        <div className="flex gap-2 text-xs font-semibold">
          <button type="button" className="text-brand-700 hover:underline" onClick={() => onChange(catalog.map((c) => c.key))}>Select all</button>
          <span className="text-navy-200">|</span>
          <button type="button" className="text-navy-500 hover:underline" onClick={() => onChange([])}>None</button>
        </div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {catalog.map((p) => {
          const on = value.includes(p.key);
          return (
            <li key={p.key}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(p.key)}
                className={cx('flex w-full items-start gap-3 rounded-xl border p-3 text-left transition', on ? 'border-brand-300 bg-brand-50' : 'border-navy-100 hover:border-navy-200')}
              >
                <span className={cx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', on ? 'border-brand-500 bg-brand-500 text-white' : 'border-navy-300 bg-white')}>
                  {on && <Check className="h-3.5 w-3.5" aria-hidden />}
                </span>
                <span><span className="block text-sm font-semibold text-navy-900">{p.label}</span><span className="text-xs text-navy-400">{p.description}</span></span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AdminModal({ admin, catalog, onClose, onSaved }) {
  const toast = useToast();
  const [v, setV] = useState({ name: admin?.name || '', email: admin?.email || '', password: '', permissions: admin?.permissions || [], active: admin?.active ?? true });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    if (v.name.trim().length < 2) errs.name = 'Name is required';
    if (!admin && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) errs.email = 'Enter a valid email';
    if (!admin && !(v.password.length >= 10 && /[a-z]/.test(v.password) && /[A-Z]/.test(v.password) && /\d/.test(v.password))) errs.password = PASSWORD_HINT;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setError('');
    try {
      if (admin) await api.patch(`/admins/${admin.id}`, { name: v.name.trim(), permissions: v.permissions, active: v.active });
      else await api.post('/admins', { name: v.name.trim(), email: v.email.trim(), password: v.password, permissions: v.permissions });
      toast.success(admin ? 'Admin updated – changes apply immediately' : 'Admin account created');
      onSaved();
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} size="lg" title={admin ? `Edit ${admin.name}` : 'Create admin'} description="Permissions are enforced by the API on every request."
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="admin-form" loading={saving}>{admin ? 'Save changes' : 'Create admin'}</Button></>}>
      <form id="admin-form" onSubmit={save} noValidate className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Full name" required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} error={errors.name} />
          <Input label="Email" required type="email" value={v.email} disabled={Boolean(admin)} onChange={(e) => setV({ ...v, email: e.target.value })} error={errors.email} autoComplete="off" />
        </div>
        {!admin && <Input label="Temporary password" required type="password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} error={errors.password} hint={PASSWORD_HINT} autoComplete="new-password" />}
        <PermissionPicker catalog={catalog} value={v.permissions} onChange={(permissions) => setV({ ...v, permissions })} />
        {admin && <Toggle checked={v.active} onChange={(active) => setV({ ...v, active })} label="Account active" description="Deactivating signs the admin out immediately." />}
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ admin, onClose }) {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post(`/admins/${admin.id}/reset-password`, { password });
      toast.success(data.message);
      onClose();
    } catch (err) {
      setError(fieldErrors(err).password || errorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm" title="Reset password" description={admin.email}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="reset-form" loading={saving}>Reset password</Button></>}>
      <form id="reset-form" onSubmit={save} noValidate>
        <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={error} hint={PASSWORD_HINT} autoComplete="new-password" />
      </form>
    </Modal>
  );
}

export default function Admins() {
  const toast = useToast();
  const { catalog, user } = useAuth();
  const { data, loading, error, reload } = useApi('/admins');
  useLiveRefresh(['admins'], reload);
  const [editing, setEditing] = useState(null);
  // Opened from the dashboard's "New" menu (?new=1)
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing('new');
      const next = new URLSearchParams(searchParams);
      next.delete('new');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [resetting, setResetting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const labelOf = Object.fromEntries(catalog.map((c) => [c.key, c.label]));

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/admins/${deleting.id}`);
      toast.success('Admin deleted');
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Administration" title="Admins & permissions" description="Create admin accounts and decide exactly what each one can see and do." actions={<Button icon={UserPlus} onClick={() => setEditing('new')}>New admin</Button>} />
      {error && <Alert className="mb-4">{error}</Alert>}
      <div className="grid gap-4 lg:grid-cols-2">
        {loading && !data && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        {data?.admins.map((a) => {
          const isSuper = a.role === 'superadmin';
          return (
            <article key={a.id} className={cx('card p-5', !a.active && 'opacity-70')}>
              <div className="flex items-start gap-4">
                <span className={cx('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold', isSuper ? 'bg-gradient-to-br from-brand-300 to-brand-500 text-navy-950' : 'bg-navy-950 text-brand-300')}>{initials(a.name)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate font-sans text-base font-semibold">{a.name}{a.id === user.id && <span className="ml-1 text-xs font-normal text-navy-400">(you)</span>}</h2>
                    {isSuper ? <Badge tone="brand"><Crown className="h-3 w-3" aria-hidden /> Super Admin</Badge> : <Badge tone={a.active ? 'green' : 'red'} dot>{a.active ? 'Active' : 'Deactivated'}</Badge>}
                  </div>
                  <p className="truncate text-sm text-navy-400">{a.email}</p>
                  <p className="mt-1 text-xs text-navy-300">Last sign-in: {a.lastLoginAt ? formatDateTime(a.lastLoginAt) : 'never'}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {isSuper ? (
                  <span className="text-xs text-navy-500">Full access to every module, admin management, settings and audit logs.</span>
                ) : a.permissions.length ? (
                  a.permissions.map((p) => <Badge key={p} tone="slate"><ShieldCheck className="h-3 w-3" aria-hidden />{labelOf[p] || p}</Badge>)
                ) : (
                  <span className="text-xs text-coral-600">No permissions – this admin can only access their account page.</span>
                )}
              </div>
              {!isSuper && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-navy-100 pt-4">
                  <Button size="sm" variant="outline" icon={ShieldCheck} onClick={() => setEditing(a)}>Edit permissions</Button>
                  <Button size="sm" variant="ghost" icon={KeyRound} onClick={() => setResetting(a)}>Reset password</Button>
                  <Button size="sm" variant="danger-ghost" icon={Trash2} onClick={() => setDeleting(a)} className="ml-auto">Delete</Button>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {editing && <AdminModal admin={editing === 'new' ? null : editing} catalog={catalog} onClose={() => setEditing(null)} onSaved={reload} />}
      {resetting && <ResetPasswordModal admin={resetting} onClose={() => setResetting(null)} />}
      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} onConfirm={remove} loading={busy} title={`Delete ${deleting?.name}?`} message="This admin will lose access immediately and the account will be permanently removed. Their past actions remain in the audit log." confirmLabel="Delete admin" />
    </>
  );
}
