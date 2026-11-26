import { useState } from 'react';
import { Search, MessageSquareText } from 'lucide-react';
import { useApi, useDebounced } from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import api, { errorMessage } from '../../lib/api';
import { ENQUIRY_STATUSES } from '../../lib/constants';
import { formatDateTime } from '../../lib/format';
import { PageHeader, Pagination } from '../../components/ui/Data';
import { Input, Select } from '../../components/ui/Form';
import { Alert, Badge, EmptyState, Skeleton } from '../../components/ui/Feedback';

const MODULES = [['mentoring', 'Mentoring'], ['training', 'Training'], ['coaching', 'Coaching']];

export default function Enquiries() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { data, loading, error, reload } = useApi('/enquiries', { search: q || undefined, module: module || undefined, status: status || undefined, page });

  const changeStatus = async (id, value) => {
    try {
      await api.patch(`/enquiries/${id}/status`, { status: value });
      toast.success('Enquiry updated');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader eyebrow="Professional development" title="Programme enquiries" description="Enquiries from the Mentoring, Training and Coaching pages." />
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-navy-100 p-4 md:flex-row">
          <Input className="flex-1" size="sm" icon={Search} placeholder="Search name or email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search enquiries" />
          <Select size="sm" value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }} placeholder="All modules" aria-label="Module" className="md:w-44">
            {MODULES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select size="sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder="All statuses" aria-label="Status" className="md:w-40">
            {ENQUIRY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
        {error && <Alert className="m-4">{error}</Alert>}
        <div className="overflow-x-auto">
          <table className="table-base w-full">
            <thead><tr><th>Contact</th><th>Module</th><th>Programme</th><th>Message</th><th>Received</th><th>Status</th></tr></thead>
            <tbody>
              {data?.items.map((e) => (
                <tr key={e._id}>
                  <td><span className="block font-semibold text-navy-900">{e.name}</span><a href={`mailto:${e.email}`} className="text-xs text-navy-400 hover:underline">{e.email}</a>{e.mobile && <span className="block text-xs text-navy-400">{e.mobile}</span>}</td>
                  <td><Badge tone="brand">{e.module}</Badge></td>
                  <td>{e.programTitle || <span className="text-navy-300">General</span>}</td>
                  <td className="max-w-xs whitespace-normal text-xs text-navy-500">{e.currentRole && <b className="block text-navy-700">{e.currentRole}</b>}{e.message || '—'}</td>
                  <td className="text-xs">{formatDateTime(e.createdAt)}</td>
                  <td>
                    <Select size="sm" value={e.status} onChange={(ev) => changeStatus(e._id, ev.target.value)} aria-label={`Status for ${e.name}`} selectClassName="min-w-[130px]">
                      {ENQUIRY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && !data && <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>}
          {data && !data.items.length && <EmptyState icon={MessageSquareText} title="No enquiries" description="Enquiries submitted on the programme pages will appear here." />}
        </div>
        {data && <Pagination {...data.pagination} onChange={setPage} />}
      </div>
    </>
  );
}
