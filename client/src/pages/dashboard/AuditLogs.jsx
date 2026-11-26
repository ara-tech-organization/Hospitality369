import { useState } from 'react';
import { Search, ScrollText } from 'lucide-react';
import { useApi, useDebounced } from '../../hooks/useApi';
import { formatDateTime } from '../../lib/format';
import { PageHeader, Pagination } from '../../components/ui/Data';
import { Input, Select } from '../../components/ui/Form';
import { Alert, Badge, EmptyState, Skeleton } from '../../components/ui/Feedback';

const toneFor = (action) => {
  if (/deleted|rejected|deactivated|suspended/.test(action)) return 'red';
  if (/downloaded|exported/.test(action)) return 'amber';
  if (/created|activated/.test(action)) return 'green';
  if (/auth\./.test(action)) return 'slate';
  return 'blue';
};

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const { data, loading, error } = useApi('/audit-logs', { search: q || undefined, action: action || undefined, page });

  return (
    <>
      <PageHeader eyebrow="Administration" title="Audit logs" description="A tamper-evident record of sign-ins, data access and administrative changes." />
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-navy-100 p-4 md:flex-row">
          <Input className="flex-1" size="sm" icon={Search} placeholder="Search summary or user…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search audit logs" />
          <Select size="sm" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} placeholder="All actions" aria-label="Filter by action" className="md:w-64">
            {data?.actions?.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
        </div>
        {error && <Alert className="m-4">{error}</Alert>}
        <div className="overflow-x-auto">
          <table className="table-base w-full">
            <thead><tr><th>When</th><th>User</th><th>Action</th><th>Details</th><th>IP</th></tr></thead>
            <tbody>
              {data?.items.map((l) => (
                <tr key={l._id}>
                  <td className="text-xs">{formatDateTime(l.createdAt)}</td>
                  <td><span className="block font-medium text-navy-900">{l.actorName || 'System'}</span><span className="text-xs text-navy-400">{l.actorEmail}</span></td>
                  <td><Badge tone={toneFor(l.action)}>{l.action}</Badge></td>
                  <td className="max-w-md whitespace-normal text-navy-600">{l.summary}</td>
                  <td className="font-mono text-xs text-navy-400">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && !data && <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>}
          {data && !data.items.length && <EmptyState icon={ScrollText} title="No matching entries" />}
        </div>
        {data && <Pagination {...data.pagination} onChange={setPage} />}
      </div>
    </>
  );
}
