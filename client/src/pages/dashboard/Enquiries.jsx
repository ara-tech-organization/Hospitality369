import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MessageSquareText, Mail, Phone, Building2, Tag, Calendar, Compass, GraduationCap, Target, Inbox, BookOpen, Briefcase } from 'lucide-react';
import { useApi, useDebounced } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import api, { errorMessage } from '../../lib/api';
import { ENQUIRY_STATUSES } from '../../lib/constants';
import { cx, formatDateTime, timeAgo, initials } from '../../lib/format';
import { PageHeader, Pagination } from '../../components/ui/Data';
import { Input, Select } from '../../components/ui/Form';
import { Alert, Badge, EmptyState, Skeleton } from '../../components/ui/Feedback';
import { Drawer } from '../../components/ui/Overlay';
import { useLiveRefresh } from '../../context/RealtimeContext';

/** Where each public form's submissions show up */
const SOURCES = [
  { value: '', label: 'All', icon: Inbox, from: 'Every form' },
  { value: 'contact', label: 'Contact Us', icon: Mail, from: 'Contact Us page (/contact)' },
  { value: 'mentoring', label: 'Mentoring', icon: Compass, from: 'Mentoring page (/mentoring)' },
  { value: 'training', label: 'Training', icon: GraduationCap, from: 'Training page (/training)' },
  { value: 'coaching', label: 'Coaching', icon: Target, from: 'Coaching page (/coaching)' },
];
const SOURCE_MAP = Object.fromEntries(SOURCES.map((s) => [s.value, s]));
const STATUS_TONE = Object.fromEntries(ENQUIRY_STATUSES.map((s) => [s.value, s.tone]));

function Detail({ e, onClose, onStatus }) {
  if (!e) return null;
  const src = SOURCE_MAP[e.module];
  return (
    <Drawer open onClose={onClose} title={e.name} subtitle={<>Received {formatDateTime(e.createdAt)}</>}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={e.module === 'contact' ? 'blue' : 'brand'}>{src?.label || e.module}</Badge>
          <Badge tone={STATUS_TONE[e.status]} dot>{ENQUIRY_STATUSES.find((s) => s.value === e.status)?.label}</Badge>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            [Mail, 'Email', <a key="m" href={`mailto:${e.email}`} className="hover:underline">{e.email}</a>],
            [Phone, 'Phone', e.mobile ? <a key="p" href={`tel:${e.mobile}`} className="hover:underline">{e.mobile}</a> : '—'],
            e.module === 'contact' ? [Tag, 'Topic', e.topic || '—'] : [BookOpen, 'Programme', e.programTitle || 'Not sure yet'],
            e.module === 'contact' ? [Building2, 'Company', e.company || '—'] : [Briefcase, 'Current role', e.currentRole || '—'],
            [Inbox, 'Submitted from', src?.from || e.module],
            [Calendar, 'Received', formatDateTime(e.createdAt)],
          ].map(([Icon, l, val]) => (
            <div key={l} className="rounded-xl bg-navy-50/60 p-3.5">
              <dt className="flex items-center gap-1.5 text-xs text-navy-400"><Icon className="h-3.5 w-3.5" aria-hidden />{l}</dt>
              <dd className="mt-1 break-words text-sm font-medium text-navy-900">{val}</dd>
            </div>
          ))}
        </dl>
        <div>
          <h3 className="font-sans text-sm font-semibold">Message</h3>
          <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-navy-100 bg-white p-4 text-sm leading-relaxed text-navy-700">{e.message || <span className="text-navy-300">No message</span>}</p>
        </div>
        <div className="rounded-2xl border border-navy-100 p-4">
          <Select label="Status" value={e.status} onChange={(ev) => onStatus(e._id, ev.target.value)}>
            {ENQUIRY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`mailto:${e.email}?subject=${encodeURIComponent('Re: your enquiry to Hospitality369')}`} className="inline-flex items-center gap-2 rounded-xl bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"><Mail className="h-4 w-4" /> Reply by email</a>
            {e.mobile && <a href={`tel:${e.mobile}`} className="inline-flex items-center gap-2 rounded-xl border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-navy-50"><Phone className="h-4 w-4" /> Call</a>}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export default function Enquiries() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const source = params.get('source') || '';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const q = useDebounced(search);
  const { data, loading, error, reload, setData } = useApi('/enquiries', { search: q || undefined, module: source || undefined, status: status || undefined, page });
  useLiveRefresh(['enquiries'], reload);
  const counts = data?.counts || {};
  const totalAll = Object.values(counts).reduce((a, c) => a + c.total, 0);
  const newAll = Object.values(counts).reduce((a, c) => a + c.new, 0);
  const open = data?.items.find((x) => x._id === openId);

  const setSource = (v) => {
    const next = new URLSearchParams(params);
    if (v) next.set('source', v); else next.delete('source');
    setParams(next, { replace: true });
    setPage(1);
  };

  const changeStatus = async (id, value) => {
    try {
      await api.patch(`/enquiries/${id}/status`, { status: value });
      setData((d) => d && { ...d, items: d.items.map((x) => (x._id === id ? { ...x, status: value } : x)) });
      toast.success('Status updated');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Inbox"
        title="Enquiries & messages"
        description="Everything submitted through the Contact Us, Mentoring, Training and Coaching forms on the website."
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" role="tablist" aria-label="Filter by source">
        {SOURCES.map((s) => {
          const on = source === s.value;
          const c = s.value ? counts[s.value] : { total: totalAll, new: newAll };
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setSource(s.value)}
              className={cx('group flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300', on ? 'border-navy-950 bg-navy-950 text-white shadow-lift' : 'border-navy-100 bg-white hover:-translate-y-0.5 hover:shadow-soft')}
            >
              <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', on ? 'bg-brand-500 text-white' : 'bg-navy-50 text-navy-600 group-hover:text-brand-600')}><Icon className="h-5 w-5" aria-hidden /></span>
              <span className="min-w-0">
                <span className={cx('block text-sm font-semibold', on ? 'text-white' : 'text-navy-900')}>{s.label}</span>
                <span className={cx('text-xs', on ? 'text-navy-200' : 'text-navy-400')}>
                  {c ? `${c.total} total` : '—'}
                  {c?.new > 0 && <span className={cx('ml-1.5 rounded-full px-1.5 py-0.5 font-bold', on ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-700')}>{c.new} new</span>}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-navy-100 p-4 md:flex-row">
          <Input className="flex-1" size="sm" icon={Search} placeholder="Search name, email, company or topic…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search enquiries" />
          <Select size="sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder="All statuses" aria-label="Status" className="md:w-44">
            {ENQUIRY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
        {error && <Alert className="m-4">{error}</Alert>}
        <ul className="divide-y divide-navy-100">
          {data?.items.map((e) => {
            const src = SOURCE_MAP[e.module];
            const SrcIcon = src?.icon || Inbox;
            return (
              <li key={e._id}>
                <button type="button" onClick={() => setOpenId(e._id)} className="group flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-brand-50/40">
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-950 text-xs font-bold text-brand-300">
                    {initials(e.name)}
                    {e.status === 'new' && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-brand-500 ring-2 ring-white" aria-label="New" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={cx('text-sm text-navy-900', e.status === 'new' ? 'font-bold' : 'font-semibold')}>{e.name}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-semibold text-navy-600"><SrcIcon className="h-3 w-3" aria-hidden />{src?.label || e.module}</span>
                      {(e.topic || e.programTitle) && <span className="text-xs font-medium text-brand-700">· {e.topic || e.programTitle}</span>}
                      {e.company && <span className="text-xs text-navy-400">· {e.company}</span>}
                    </span>
                    <span className="mt-1 block truncate text-sm text-navy-500">{e.message || <em className="text-navy-300">No message</em>}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-xs text-navy-400">{timeAgo(e.createdAt)}</span>
                    <Badge tone={STATUS_TONE[e.status]} dot>{ENQUIRY_STATUSES.find((s) => s.value === e.status)?.label}</Badge>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {loading && !data && <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>}
        {data && !data.items.length && (
          <EmptyState
            icon={MessageSquareText}
            title="Nothing here yet"
            description={source ? `Submissions from the ${SOURCE_MAP[source].from} will appear here.` : 'Submissions from the Contact Us, Mentoring, Training and Coaching forms will appear here.'}
          />
        )}
        {data && <Pagination {...data.pagination} onChange={setPage} />}
      </div>

      <Detail e={open} onClose={() => setOpenId(null)} onStatus={changeStatus} />
    </>
  );
}
