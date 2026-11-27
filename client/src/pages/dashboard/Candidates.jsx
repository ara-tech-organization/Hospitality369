import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, FileSpreadsheet, FileText, Filter, X, Users, Mail, Phone, Briefcase, Calendar, Gift, Trash2, ChevronDown, ArrowDownUp } from 'lucide-react';
import { useApi, useDebounced } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api, { downloadFile, errorMessage } from '../../lib/api';
import { PERMISSIONS as P, STATUSES } from '../../lib/constants';
import { formatDate, formatDateTime, formatBytes, initials, cx, timeAgo } from '../../lib/format';
import { PageHeader, Pagination } from '../../components/ui/Data';
import { Input, Select, Textarea } from '../../components/ui/Form';
import { Alert, EmptyState, StatusBadge, Badge, Skeleton } from '../../components/ui/Feedback';
import { Drawer, ConfirmDialog } from '../../components/ui/Overlay';
import Button from '../../components/ui/Button';
import { REFERRALS_ENABLED } from '../../lib/features';
import { useLiveRefresh } from '../../context/RealtimeContext';

const FILTER_KEYS = ['search', 'role', 'status', 'from', 'to', 'sort', 'page'];

function CandidateDrawer({ id, onClose, onChanged }) {
  const { can, isSuperAdmin } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useApi(id ? `/applications/${id}` : null);
  useLiveRefresh(['applications'], id ? reload : null);
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
              ...(REFERRALS_ENABLED ? [[Gift, 'Referral', data.referral ? `${data.referral.referrer?.name} (${data.referral.status})` : '—']] : []),
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

/** Export menu – one per format (Excel / PDF), each offering filtered or all */
const EXPORT_FORMATS = {
  excel: { label: 'Export Excel', icon: FileSpreadsheet, url: '/applications/export', fallback: 'candidates.xlsx', variant: 'outline', tint: 'text-[#188038]' },
  pdf: { label: 'Export PDF', icon: FileText, url: '/applications/export.pdf', fallback: 'candidates.pdf', variant: 'outline', tint: 'text-[#d93025]' },
};

function ExportMenu({ format, filters, total }) {
  const toast = useToast();
  const cfg = EXPORT_FORMATS[format];
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const run = async (scope) => {
    setOpen(false);
    setBusy(true);
    try {
      const params = scope === 'all' ? { scope: 'all', sort: filters.sort } : { ...filters, page: undefined, limit: undefined, scope: 'filtered' };
      const name = await downloadFile(cfg.url, params, cfg.fallback);
      toast.success(`Downloaded ${name}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Export failed'));
    } finally {
      setBusy(false);
    }
  };
  const Icon = cfg.icon;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-[#c4c7c5] bg-white pl-3.5 pr-3 text-sm font-medium text-navy-800 transition hover:bg-[#f1f3f4] disabled:opacity-60"
      >
        {busy ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-200 border-t-navy-700" /> : <Icon className={cx('h-[18px] w-[18px]', cfg.tint)} aria-hidden />}
        {cfg.label}
        <ChevronDown className={cx('h-4 w-4 text-navy-500 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div role="menu" className="absolute right-0 z-20 mt-2 w-72 animate-scale-in rounded-2xl bg-white py-2 shadow-[0_2px_6px_2px_rgba(60,64,67,.15),0_1px_2px_rgba(60,64,67,.3)]">
            <button role="menuitem" type="button" onClick={() => run('filtered')} className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-[#f1f3f4]">
              <Filter className="mt-0.5 h-4 w-4 text-navy-500" aria-hidden />
              <span>
                <span className="block text-sm font-medium text-navy-900">Filtered results</span>
                <span className="text-xs text-navy-500">{total} record{total === 1 ? '' : 's'} matching current view</span>
              </span>
            </button>
            <button role="menuitem" type="button" onClick={() => run('all')} className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-[#f1f3f4]">
              <Users className="mt-0.5 h-4 w-4 text-navy-500" aria-hidden />
              <span>
                <span className="block text-sm font-medium text-navy-900">All candidates</span>
                <span className="text-xs text-navy-500">Every application on record</span>
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** File chip showing the uploaded resume's name – click to download */
function ResumeFile({ id, name, size, mimeType, canDownload }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const ext = (name?.split('.').pop() || '').toUpperCase();
  const isPdf = ext === 'PDF' || mimeType === 'application/pdf';
  const badge = isPdf ? 'bg-[#fce8e6] text-[#c5221f]' : 'bg-[#e8f0fe] text-[#1a73e8]';
  const body = (
    <>
      <span className={cx('flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg text-[9px] font-bold leading-none', badge)}>
        <FileText className="mb-0.5 h-3.5 w-3.5" aria-hidden />
        {ext || 'FILE'}
      </span>
      <span className="min-w-0 text-left">
        <span className="block max-w-[190px] truncate text-[13px] font-medium text-navy-900" title={name}>{name || 'Resume'}</span>
        <span className="flex items-center gap-1 text-[11px] text-navy-500">
          {formatBytes(size || 0)}
          {canDownload && (busy ? <span className="ml-1 h-3 w-3 animate-spin rounded-full border-2 border-navy-200 border-t-navy-600" /> : <Download className="ml-1 h-3 w-3 opacity-0 transition group-hover/file:opacity-100" aria-hidden />)}
        </span>
      </span>
    </>
  );
  if (!canDownload) return <span className="inline-flex items-center gap-2.5 opacity-80" title="You don't have permission to download resumes">{body}</span>;
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async (e) => {
        e.stopPropagation();
        setBusy(true);
        try {
          await downloadFile(`/applications/${id}/resume`, undefined, name);
        } catch (err) {
          toast.error(errorMessage(err, 'Download failed'));
        } finally {
          setBusy(false);
        }
      }}
      aria-label={`Download ${name}`}
      className="group/file inline-flex items-center gap-2.5 rounded-xl border border-transparent py-1 pl-1 pr-3 transition hover:border-[#dadce0] hover:bg-white hover:shadow-[0_1px_2px_rgba(60,64,67,.3)]"
    >
      {body}
    </button>
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
  useEffect(() => setSearch(filters.search), [filters.search]);

  const query = { ...filters, sort: filters.sort || 'newest', page: filters.page || 1, limit: 10 };
  Object.keys(query).forEach((k) => query[k] === '' && delete query[k]);
  const { data, loading, error, reload } = useApi('/applications', query);
  const { data: roleData, reload: reloadRoles } = useApi('/roles/options');
  useLiveRefresh(['applications'], reload);
  useLiveRefresh(['roles'], reloadRoles);
  const counts = data?.statusCounts || {};
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);

  const activeFilterCount = ['role', 'from', 'to'].filter((k) => filters[k]).length;
  const clear = () => {
    setSearch('');
    setParams(new URLSearchParams(), { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Candidates"
        description="Search, filter and manage every application in one place."
        actions={can(P.CANDIDATES_EXPORT) && (
          <>
            <ExportMenu format="excel" filters={query} total={data?.pagination.total || 0} />
            <ExportMenu format="pdf" filters={query} total={data?.pagination.total || 0} />
          </>
        )}
      />

      {/* status tabs with live counts (Gmail-style categories) */}
      <div className="no-scrollbar -mx-1 mb-4 flex gap-1 overflow-x-auto border-b border-[#e3e6ea] px-1" role="tablist" aria-label="Filter by status">
        {[{ value: '', label: 'All', tone: 'slate' }, ...STATUSES].map((s) => {
          const on = (filters.status || '') === s.value;
          const n = s.value ? counts[s.value] ?? 0 : allCount;
          return (
            <button
              key={s.value || 'all'}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => update({ status: s.value })}
              className={cx(
                'relative flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t-lg px-4 pb-3 pt-2.5 text-sm font-medium transition-colors',
                on ? 'text-brand-700' : 'text-navy-600 hover:bg-[#f1f3f4]'
              )}
            >
              {s.label}
              <span className={cx('rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums', on ? 'bg-brand-100 text-brand-800' : 'bg-[#eef0f3] text-navy-600')}>{data ? n : '·'}</span>
              {on && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-brand-500" aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[#e3e6ea] p-3 lg:flex-row lg:items-center">
          <Input className="flex-1" size="sm" icon={Search} placeholder="Search by name, email or mobile…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search candidates" />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" icon={Filter} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
              More filters{activeFilterCount ? <Badge tone="brand" className="ml-1">{activeFilterCount}</Badge> : null}
            </Button>
            <Button variant="outline" size="sm" icon={ArrowDownUp} onClick={() => update({ sort: filters.sort === 'oldest' ? 'newest' : 'oldest' })}>
              {filters.sort === 'oldest' ? 'Oldest first' : 'Newest first'}
            </Button>
            {(activeFilterCount > 0 || filters.search || filters.status) && <Button variant="ghost" size="sm" icon={X} onClick={clear}>Clear all</Button>}
          </div>
        </div>

        {(showFilters || activeFilterCount > 0) && (
          <div className="grid animate-fade-in gap-3 border-b border-[#e3e6ea] bg-[#f8fafd] p-4 sm:grid-cols-3">
            <Select size="sm" label="Role" value={filters.role} onChange={(e) => update({ role: e.target.value })} placeholder="All roles">
              {roleData?.roles.map((r) => <option key={r._id} value={r._id}>{r.title}{r.active ? '' : ' (inactive)'}</option>)}
              <option value="other">Others (role not listed)</option>
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
                <th>Applied for</th>
                <th>Mobile</th>
                <th>Applied</th>
                <th>Status</th>
                <th>Resume</th>
              </tr>
            </thead>
            <tbody>
              {loading && !data && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={6}><Skeleton className="h-9" /></td></tr>
              ))}
              {data?.items.map((a) => (
                <tr key={a._id} className={cx('cursor-pointer', loading && 'opacity-60')} onClick={() => update({ open: a._id }, false)}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-950 text-xs font-semibold text-white">{initials(a.fullName)}</span>
                      <span className="min-w-0">
                        <button type="button" className="block max-w-[200px] truncate font-medium text-navy-900 hover:underline" onClick={(e) => { e.stopPropagation(); update({ open: a._id }, false); }}>{a.fullName}</button>
                        <span className="block max-w-[200px] truncate text-xs text-navy-500">{a.email}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="block font-medium text-navy-900">{a.isOtherRole ? a.position : a.roleTitle}</span>
                    <span className="text-xs text-navy-500">{a.isOtherRole ? 'Others · typed by candidate' : a.position || 'Any position'}</span>
                  </td>
                  <td className="tabular-nums text-navy-700">{a.mobile}</td>
                  <td>
                    <span className="block text-navy-900">{formatDate(a.createdAt)}</span>
                    <span className="text-xs text-navy-500">{timeAgo(a.createdAt)}</span>
                  </td>
                  <td><StatusBadge status={a.status} /></td>
                  <td>
                    <ResumeFile id={a._id} name={a.resume?.originalName} size={a.resume?.size} mimeType={a.resume?.mimeType} canDownload={can(P.RESUMES_DOWNLOAD)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && !data.items.length && (
            <EmptyState icon={Users} title="No candidates found" description={activeFilterCount || filters.search || filters.status ? 'Try adjusting your search or filters.' : 'Applications will appear here as candidates apply.'} action={(activeFilterCount > 0 || filters.search || filters.status) && <Button variant="outline" size="sm" onClick={clear}>Clear filters</Button>} />
          )}
        </div>
        {data && <Pagination {...data.pagination} onChange={(p) => update({ page: String(p) }, false)} />}
      </div>

      <CandidateDrawer id={openId} onClose={() => update({ open: '' }, false)} onChanged={reload} />
    </>
  );
}
