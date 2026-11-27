import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Briefcase, X, Users, ExternalLink } from 'lucide-react';
import { useApi, useDebounced } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api, { errorMessage, fieldErrors } from '../../lib/api';
import { INDUSTRIES, INDUSTRY_LABEL, PERMISSIONS as P } from '../../lib/constants';
import { formatNumber } from '../../lib/format';
import { PageHeader } from '../../components/ui/Data';
import { Input, Select, Textarea, Toggle } from '../../components/ui/Form';
import { Alert, Badge, EmptyState, Skeleton } from '../../components/ui/Feedback';
import { Modal, ConfirmDialog } from '../../components/ui/Overlay';
import Button from '../../components/ui/Button';
import { useLiveRefresh } from '../../context/RealtimeContext';

const EMPTY = { title: '', industry: '', description: '', positions: [], active: true, sortOrder: 0 };

function RoleForm({ role, onClose, onSaved }) {
  const toast = useToast();
  const [v, setV] = useState(role ? { ...EMPTY, ...role } : EMPTY);
  const [position, setPosition] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const addPosition = () => {
    const p = position.trim();
    if (p.length < 2) return;
    if (v.positions.some((x) => x.toLowerCase() === p.toLowerCase())) {
      setErrors((e) => ({ ...e, positions: 'This position is already listed' }));
      return;
    }
    if (v.positions.length >= 20) return;
    setV((x) => ({ ...x, positions: [...x.positions, p] }));
    setPosition('');
    setErrors((e) => ({ ...e, positions: undefined }));
  };

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    if (v.title.trim().length < 2) errs.title = 'Title is required';
    if (!v.industry) errs.industry = 'Select an industry';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setError('');
    const body = { title: v.title.trim(), industry: v.industry, description: v.description.trim(), positions: v.positions, active: v.active, sortOrder: Number(v.sortOrder) || 0 };
    try {
      if (role) await api.patch(`/roles/${role._id}`, body);
      else await api.post('/roles', body);
      toast.success(role ? 'Role updated' : 'Role created – it is now live on the application form');
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
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={role ? 'Edit role' : 'New recruitment role'}
      description="Active roles appear immediately on the public application form."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="role-form" loading={saving}>{role ? 'Save changes' : 'Create role'}</Button>
        </>
      }
    >
      <form id="role-form" onSubmit={save} noValidate className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <div className="grid gap-5 sm:grid-cols-[1.5fr_1fr]">
          <Input label="Role title" required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} error={errors.title} maxLength={80} placeholder="e.g. Sommelier" />
          <Select label="Industry" required value={v.industry} onChange={(e) => setV({ ...v, industry: e.target.value })} error={errors.industry} placeholder="Select industry">
            {INDUSTRIES.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
          </Select>
        </div>
        <Textarea label="Description" rows={3} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} maxLength={600} hint="Shown to candidates when they select this role." />
        <div>
          <span className="label">Positions</span>
          <div className="flex gap-2">
            <Input
              className="flex-1"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPosition(); } }}
              placeholder="e.g. Head Sommelier – press Enter to add"
              maxLength={80}
              aria-label="New position"
              error={errors.positions}
            />
            <Button variant="outline" onClick={addPosition} icon={Plus} className="h-[50px]">Add</Button>
          </div>
          <p className="mt-1.5 text-[13px] text-navy-400">Candidates choose one of these. Leave empty to let them type a position.</p>
          {v.positions.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {v.positions.map((p) => (
                <li key={p} className="inline-flex items-center gap-1.5 rounded-full bg-navy-50 py-1 pl-3 pr-1.5 text-sm text-navy-700 ring-1 ring-navy-100">
                  {p}
                  <button type="button" onClick={() => setV({ ...v, positions: v.positions.filter((x) => x !== p) })} className="rounded-full p-0.5 text-navy-400 hover:bg-white hover:text-coral-600" aria-label={`Remove ${p}`}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid items-center gap-5 sm:grid-cols-2">
          <Input label="Display order" type="number" min={0} max={9999} value={v.sortOrder} onChange={(e) => setV({ ...v, sortOrder: e.target.value })} hint="Lower numbers appear first" />
          <Toggle checked={v.active} onChange={(active) => setV({ ...v, active })} label="Active" description="Visible on the application form" />
        </div>
      </form>
    </Modal>
  );
}

export default function Roles() {
  const toast = useToast();
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('');
  const [active, setActive] = useState('');
  const q = useDebounced(search);
  const { data, loading, error, reload } = useApi('/roles', { search: q || undefined, industry: industry || undefined, active: active || undefined });
  useLiveRefresh(['roles', 'applications'], reload);
  const [editing, setEditing] = useState(null); // null | 'new' | role
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
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toggling, setToggling] = useState(null);

  const toggle = async (role) => {
    setToggling(role._id);
    try {
      await api.patch(`/roles/${role._id}/status`, { active: !role.active });
      toast.success(`"${role.title}" ${role.active ? 'deactivated – hidden from the form' : 'activated – now live on the form'}`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setToggling(null);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/roles/${deleting._id}`);
      toast.success('Role deleted');
      reload();
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const roles = data?.roles || [];

  return (
    <>
      <PageHeader
        eyebrow="Recruitment"
        title="Recruitment roles"
        description="Create and manage the hospitality roles candidates can apply for."
        actions={<Button icon={Plus} onClick={() => setEditing('new')}>New role</Button>}
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <Input className="flex-1" size="sm" icon={Search} placeholder="Search roles…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search roles" />
        <Select size="sm" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="All industries" aria-label="Filter by industry" className="sm:w-48">
          {INDUSTRIES.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
        </Select>
        <Select size="sm" value={active} onChange={(e) => setActive(e.target.value)} placeholder="All statuses" aria-label="Filter by status" className="sm:w-40">
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {loading && !data && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        {roles.map((r) => (
          <article key={r._id} className="card flex flex-col p-5 transition hover:shadow-lift">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="slate">{INDUSTRY_LABEL[r.industry]}</Badge>
                  <Badge tone={r.active ? 'green' : 'slate'} dot>{r.active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <h2 className="mt-3 truncate font-sans text-lg font-semibold">{r.title}</h2>
              </div>
              <Toggle checked={r.active} onChange={() => toggle(r)} disabled={toggling === r._id} id={`toggle-${r._id}`} />
            </div>
            <p className="mt-1.5 line-clamp-2 min-h-[40px] text-sm text-navy-500">{r.description || 'No description'}</p>
            <p className="mt-3 text-xs text-navy-400">{r.positions.length ? r.positions.slice(0, 4).join(' · ') + (r.positions.length > 4 ? ` +${r.positions.length - 4}` : '') : 'Free-text position'}</p>
            <div className="mt-5 flex items-center justify-between border-t border-navy-100 pt-4">
              {can(P.CANDIDATES_VIEW) ? (
                <Link to={`/admin/candidates?role=${r._id}`} className="group inline-flex items-center gap-1.5 text-sm">
                  <Users className="h-4 w-4 text-navy-400" aria-hidden />
                  <span className="font-semibold text-navy-900">{formatNumber(r.applicationCount)}</span>
                  <span className="text-navy-400">applications</span>
                  {r.newApplicationCount > 0 && <Badge tone="blue">{r.newApplicationCount} new</Badge>}
                  <ExternalLink className="h-3.5 w-3.5 text-navy-300 group-hover:text-brand-600" aria-hidden />
                </Link>
              ) : (
                <span className="text-sm text-navy-500"><b className="text-navy-900">{formatNumber(r.applicationCount)}</b> applications</span>
              )}
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setEditing(r)} aria-label={`Edit ${r.title}`}><Pencil className="h-4 w-4" /></Button>
                <Button variant="danger-ghost" size="icon" onClick={() => setDeleting(r)} aria-label={`Delete ${r.title}`}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {data && !roles.length && (
        <div className="card"><EmptyState icon={Briefcase} title="No roles found" description="Create your first recruitment role to start receiving applications." action={<Button icon={Plus} onClick={() => setEditing('new')}>New role</Button>} /></div>
      )}

      {editing && <RoleForm role={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={reload} />}
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={
          deleting?.applicationCount
            ? async () => {
                if (deleting.active) await toggle(deleting);
                setDeleting(null);
              }
            : remove
        }
        loading={busy}
        tone={deleting?.applicationCount ? 'primary' : 'danger'}
        title={`Delete "${deleting?.title}"?`}
        message={deleting?.applicationCount ? `This role has ${deleting.applicationCount} application(s), so it can't be deleted. Deactivate it instead to hide it from the form while keeping its history.` : 'This role will be permanently removed. This cannot be undone.'}
        confirmLabel={deleting?.applicationCount ? (deleting.active ? 'Deactivate instead' : 'OK') : 'Delete role'}
      />
    </>
  );
}
