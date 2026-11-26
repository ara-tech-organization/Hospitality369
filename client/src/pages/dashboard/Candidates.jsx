import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, FileSpreadsheet, FileText, Filter, X, Users, Mail, Phone, Briefcase, Calendar, Gift, Trash2, ChevronDown, ArrowDownUp } from 'lucide-react';
import { useApi, useDebounced } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api, { downloadFile, errorMessage } from '../../lib/api';
import { PERMISSIONS as P, STATUSES } from '../../lib/constants';
import { formatDate, formatDateTime, formatBytes, initials, cx } from '../../lib/format';
import { PageHeader, Pagination } from '../../components/ui/Data';
import { Input, Select, Textarea } from '../../components/ui/Form';
import { Alert, EmptyState, StatusBadge, Badge, Skeleton } from '../../components/ui/Feedback';
import { Drawer, ConfirmDialog } from '../../components/ui/Overlay';
import Button from '../../components/ui/Button';

const FILTER_KEYS = ['search', 'role', 'status', 'from', 'to', 'sort', 'page'];

function CandidateDrawer({ id, onClose, onChanged }) {
  const { can, isSuperAdmin } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(id ? `/applications/${id}` : null);
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const app = data?.application;

  useEffect(() => {
    if (app) setStatus(app.status);
    setNote('');
  }, [app]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/applications/${id}/status`, { status, note });
      toast.success('Application status updated');
      reload();
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      await downloadFile(`/applications/${id}/resume`, undefined, app.resume.originalName);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not download the resume'));
    } finally {
      setDownloading(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/applications/${id}`);
      toast.success('Application deleted');
      onChanged();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <Drawer
      open={Boolean(id)}
      onClose={onClose}
      title={app?.fullName || 'Candidate'}
      subtitle={app && <>Applied {formatDateTime(app.createdAt)} · Ref <span className="font-mono">{String(app._id).slice(-8).toUpperCase()}</span></>}
      footer={
        app && isSuperAdmin && (
          <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={() => setConfirmDelete(true)}>Delete application</Button>
        )
      }
    >
      {error && <Alert>{error}</Alert>}
      {loading && !app && <div className="space-y-4"><Skeleton className="h-20" /><Skeleton className="h-40" /><Skeleton className="h-32" /></div>}
      {app && (
        <div className="space-y-7">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-950 font-display text-lg text-brand-300">{initials(app.fullName)}</span>
            <div>
              <StatusBadge status={app.status} />
              <p className="mt-1 text-sm text-navy-500">{app.roleTitle} · {app.position}</p>
            </div>
          </div>

          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              [Mail, 'Email', <a key="e" href={`mailto:${app.email}`} className="text-navy-900 hover:underline">{app.email}</a>],
              [Phone, 'Mobile', <a key="m" href={`tel:${app.mobile}`} className="text-navy-900 hover:underline">{app.mobile}</a>],
              [Briefcase, 'Applied role', app.roleTitle],
              [Briefcase, 'Position', app.position],
              [Calendar, 'Application date', formatDateTime(app.createdAt)],
              [Gift, 'Referral', data.referral ? `${data.referral.referrer?.name} (${data.referral.status})` : '—'],
            ].map(([Icon, l, v]) => (
              <div key={l} className="rounded-xl bg-navy-50/60 p-3.5">
                <dt className="flex items-center gap-1.5 text-xs text-navy-400"><Icon className="h-3.5 w-3.5" aria-hidden />{l}</dt>
                <dd className="mt-1 break-words text-sm font-medium text-navy-900">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center gap-3 rounded-2xl border border-navy-100 p-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><FileText className="h-5 w-5" aria-hidden /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy-900">{app.resume.originalName}</p>
              <p className="text-xs text-navy-400">{formatBytes(app.resume.size)}</p>
            </div>
            {can(P.RESUMES_DOWNLOAD) ? (
              <Button size="sm" icon={Download} loading={downloading} onClick={download}>Download</Button>
            ) : (
              <span className="text-xs text-navy-400">No download access</span>
            )}
          </div>

          {can(P.CANDIDATES_UPDATE_STATUS) && (
            <div className="rounded-2xl border border-navy-100 p-5">
              <h3 className="font-sans text-sm font-semibold">Update status</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    aria-pressed={status === s.value}
                    className={cx('rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition', status === s.value ? 'bg-navy-950 text-white ring-navy-950' : 'bg-white text-navy-600 ring-navy-200 hover:ring-navy-300')}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <Textarea className="mt-4" label="Note (optional)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="e.g. Strong fine-dining background, invite to trial shift" />
              <Button className="mt-4" size="sm" loading={saving} disabled={status === app.status && !note.trim()} onClick={save}>Save changes</Button>
            </div>
          )}

          <div>
            <h3 className="font-sans text-sm font-semibold">Activity</h3>
            <ol className="relative mt-4 space-y-5 border-l border-navy-100 pl-5">
              {[...app.statusHistory].reverse().map((h, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-400 ring-1 ring-brand-200" aria-hidden />
                  <div className="flex flex-wrap items-center gap-2"><StatusBadge status={h.status} /><span className="text-xs text-navy-400">{formatDateTime(h.at)} · {h.changedByName || 'System'}</span></div>
                  {h.note && <p className="mt-1.5 text-sm text-navy-600">{h.note}</p>}
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        loading={deleting}
        title="Delete this application?"
        message="The application and the candidate's CV will be permanently deleted. This is intended for data-removal requests and cannot be undone."
        confirmLabel="Delete permanently"
      />
    </Drawer>
  );
}

function ExportMenu({ filters, total }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = async (scope) => {
    setOpen(false);
    setBusy(true);
    try {
      const params = scope === 'all' ? { scope: 'all', sort: filters.sort } : { ...filters, page: undefined, scope: 'filtered' };
      const name = await downloadFile('/applications/export', params, 'candidates.xlsx');
      toast.success(`Exported ${name}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Export failed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="relative">
      <Button variant="brand" size="sm" icon={FileSpreadsheet} iconRight={ChevronDown} loading={busy} onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        Export Excel
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div role="menu" className="absolute right-0 z-20 mt-2 w-64 animate-scale-in rounded-2xl border border-navy-100 bg-white p-1.5 shadow-lift">
            <button role="menuitem" type="button" onClick={() => run('filtered')} className="w-full rounded-xl px-3 py-2.5 text-left hover:bg-navy-50">
              <span className="block text-sm font-semibold text-navy-900">Filtered results</span>
              <span className="text-xs text-navy-400">{total} record{total === 1 ? '' : 's'} matching current filters</span>
            </button>
            <button role="menuitem" type="button" onClick={() => run('all')} className="w-full rounded-xl px-3 py-2.5 text-left hover:bg-navy-50">
              <span className="block text-sm font-semibold text-navy-900">All candidates</span>
              <span className="text-xs text-navy-400">Every application on record</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Candidates() {
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || ''])), [params]);
  const [search, setSearch] = useState(filters.search);
  const debounced = useDebounced(search);
  const [showFilters, setShowFilters] = useState(false);
  const openId = params.get('open');

  const update = (patch, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries({ ...patch, ...(resetPage ? { page: '' } : {}) }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if (debounced !== filters.search) update({ search: debounced.trim() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const query = { ...filters, sort: filters.sort || 'newest', page: filters.page || 1, limit: 10 };
  Object.keys(query).forEach((k) => query[k] === '' && delete query[k]);
  const { data, loading, error, reload } = useApi('/applications', query);
  const { data: roleData } = useApi('/roles/options');

  const activeFilterCount = ['role', 'status', 'from', 'to'].filter((k) => filters[k]).length;
  const clear = () => {
    setSearch('');
    setParams(new URLSearchParams(), { replace: true });
  };

  return (
    <>
      <PageHeader
        eyebrow="Recruitment"
        title="Candidates"
        description="Search, filter and manage every application in one place."
        actions={can(P.CANDIDATES_EXPORT) && <ExportMenu filters={query} total={data?.pagination.total || 0} />}
      />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-navy-100 p-4 lg:flex-row lg:items-center">
          <Input
            className="flex-1"
            size="sm"
            icon={Search}
            placeholder="Search by name, email or mobile…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search candidates"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" icon={Filter} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
              Filters{activeFilterCount ? <Badge tone="brand" className="ml-1">{activeFilterCount}</Badge> : null}
            </Button>
            <Button variant="outline" size="sm" icon={ArrowDownUp} onClick={() => update({ sort: filters.sort === 'oldest' ? 'newest' : 'oldest' })}>
              {filters.sort === 'oldest' ? 'Oldest first' : 'Newest first'}
            </Button>
            {(activeFilterCount > 0 || filters.search) && <Button variant="ghost" size="sm" icon={X} onClick={clear}>Clear</Button>}
          </div>
        </div>

        {(showFilters || activeFilterCount > 0) && (
          <div className="grid animate-fade-in gap-3 border-b border-navy-100 bg-navy-50/40 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select size="sm" label="Role" value={filters.role} onChange={(e) => update({ role: e.target.value })} placeholder="All roles">
              {roleData?.roles.map((r) => <option key={r._id} value={r._id}>{r.title}{r.active ? '' : ' (inactive)'}</option>)}
            </Select>
            <Select size="sm" label="Status" value={filters.status} onChange={(e) => update({ status: e.target.value })} placeholder="All statuses">
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Select>
            <Input size="sm" type="date" label="Applied from" value={filters.from} max={filters.to || undefined} onChange={(e) => update({ from: e.target.value })} />
            <Input size="sm" type="date" label="Applied to" value={filters.to} min={filters.from || undefined} onChange={(e) => update({ to: e.target.value })} />
          </div>
        )}

        {error && <Alert className="m-4">{error}</Alert>}

        <div className="overflow-x-auto">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Mobile</th>
                <th>Applied role</th>
                <th>Position</th>
                <th>Application date</th>
                <th>Status</th>
                <th className="text-right">Resume</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={7}><Skeleton className="h-8" /></td></tr>
              ))}
              {data?.items.map((a) => (
                <tr key={a._id} className={cx('cursor-pointer', loading && 'opacity-60')} onClick={() => update({ open: a._id }, false)}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy-950 text-xs font-bold text-brand-300">{initials(a.fullName)}</span>
                      <span>
                        <button type="button" className="block font-semibold text-navy-900 hover:underline" onClick={(e) => { e.stopPropagation(); update({ open: a._id }, false); }}>{a.fullName}</button>
                        <span className="text-xs text-navy-400">{a.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="tabular-nums">{a.mobile}</td>
                  <td>{a.roleTitle}</td>
                  <td>{a.position}</td>
                  <td>{formatDate(a.createdAt)}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    {can(P.RESUMES_DOWNLOAD) ? <ResumeButton id={a._id} name={a.resume?.originalName} /> : <span className="text-xs text-navy-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && !data.items.length && (
            <EmptyState icon={Users} title="No candidates found" description={activeFilterCount || filters.search ? 'Try adjusting your search or filters.' : 'Applications will appear here as candidates apply.'} action={(activeFilterCount > 0 || filters.search) && <Button variant="outline" size="sm" onClick={clear}>Clear filters</Button>} />
          )}
        </div>
        {data && <Pagination {...data.pagination} onChange={(p) => update({ page: String(p) }, false)} />}
      </div>

      <CandidateDrawer id={openId} onClose={() => update({ open: '' }, false)} onChanged={reload} />
    </>
  );
}

function ResumeButton({ id, name }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="xs"
      icon={Download}
      loading={busy}
      aria-label={`Download resume ${name || ''}`}
      onClick={async () => {
        setBusy(true);
        try {
          await downloadFile(`/applications/${id}/resume`, undefined, name);
        } catch (err) {
          toast.error(errorMessage(err, 'Download failed'));
        } finally {
          setBusy(false);
        }
      }}
    >
      CV
    </Button>
  );
}
