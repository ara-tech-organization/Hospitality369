import { useState } from 'react';
import { Gift, Users, CheckCircle2, XCircle, Coins, CalendarRange, Search, PlusCircle, Ban, RotateCcw, Trophy, ShieldAlert, Settings2 } from 'lucide-react';
import { useApi, useDebounced } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api, { errorMessage, fieldErrors } from '../../lib/api';
import { REJECTION_REASONS } from '../../lib/constants';
import { formatDate, formatNumber, cx } from '../../lib/format';
import { PageHeader, StatCard, Pagination, Card } from '../../components/ui/Data';
import { Input, Select } from '../../components/ui/Form';
import { Alert, Badge, EmptyState, Skeleton, StatusBadge } from '../../components/ui/Feedback';
import { Modal, Drawer, ConfirmDialog } from '../../components/ui/Overlay';
import Button from '../../components/ui/Button';

function AdjustModal({ referrer, onClose, onDone }) {
  const toast = useToast();
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!Number.isInteger(Number(points)) || Number(points) === 0) errs.points = 'Enter a whole number other than zero';
    if (reason.trim().length < 3) errs.reason = 'Give a reason';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await api.post(`/referrals/referrers/${referrer._id}/adjust`, { points: Number(points), reason: reason.trim() });
      toast.success('Points adjusted');
      onDone();
      onClose();
    } catch (err) {
      setErrors(fieldErrors(err));
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm" title="Adjust points" description={`${referrer.name} · current balance ${formatNumber(referrer.totalPoints)} pts`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="adjust-form" loading={saving}>Apply adjustment</Button></>}>
      <form id="adjust-form" onSubmit={submit} noValidate className="space-y-4">
        <Input label="Points" type="number" required value={points} onChange={(e) => setPoints(e.target.value)} error={errors.points} hint="Use a negative number to deduct (e.g. -20)" />
        <Input label="Reason" required value={reason} onChange={(e) => setReason(e.target.value)} error={errors.reason} maxLength={300} placeholder="e.g. Bonus for hospitality job fair referrals" />
      </form>
    </Modal>
  );
}

function ReferrerDrawer({ id, onClose }) {
  const { data, loading } = useApi(id ? `/referrals/referrers/${id}` : null);
  const r = data?.referrer;
  return (
    <Drawer open={Boolean(id)} onClose={onClose} title={r?.name || 'Referrer'} subtitle={r && `${r.email} · ${r.code}`}>
      {loading && !r && <Skeleton className="h-40" />}
      {r && (
        <div className="space-y-7">
          <div className="grid grid-cols-3 gap-3">
            {[['Points', r.totalPoints], ['Referrals', r.successfulReferrals], ['Joined', formatDate(r.createdAt)]].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-navy-50/60 p-3.5"><p className="text-xs text-navy-400">{l}</p><p className="mt-1 font-semibold text-navy-900">{typeof v === 'number' ? formatNumber(v) : v}</p></div>
            ))}
          </div>
          <div>
            <h3 className="font-sans text-sm font-semibold">Referrals</h3>
            {data.referrals.length ? (
              <ul className="mt-3 divide-y divide-navy-100 rounded-2xl border border-navy-100">
                {data.referrals.map((x) => (
                  <li key={x._id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-navy-900">{x.candidateName}</p>
                      <p className="text-xs text-navy-400">{x.application?.roleTitle} · {formatDate(x.createdAt)}{x.status === 'rejected' && ` · ${REJECTION_REASONS[x.rejectionReason] || 'Rejected'}`}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {x.application && <StatusBadge status={x.application.status} />}
                      <Badge tone={x.status === 'valid' ? 'green' : 'red'}>{x.pointsAwarded} pts</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-navy-400">No referrals yet.</p>}
          </div>
          <div>
            <h3 className="font-sans text-sm font-semibold">Manual adjustments</h3>
            {r.adjustments?.length ? (
              <ul className="mt-3 space-y-2">
                {[...r.adjustments].reverse().map((a, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 rounded-xl bg-navy-50/60 px-4 py-3 text-sm">
                    <div><p className="text-navy-800">{a.reason}</p><p className="text-xs text-navy-400">{formatDate(a.at)} · by {a.byName}</p></div>
                    <Badge tone={a.points > 0 ? 'green' : 'red'}>{a.points > 0 ? '+' : ''}{a.points}</Badge>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-navy-400">None.</p>}
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default function ReferralAdmin() {
  const toast = useToast();
  const { isSuperAdmin } = useAuth();
  const [tab, setTab] = useState('referrers');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const summary = useApi('/referrals/summary');
  const list = useApi(tab === 'referrers' ? '/referrals/referrers' : '/referrals', { search: q || undefined, page, status: tab === 'referrals' ? status || undefined : undefined });
  const [adjusting, setAdjusting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [busy, setBusy] = useState(false);
  const s = summary.data?.stats;

  const reloadAll = () => {
    list.reload();
    summary.reload();
  };

  const toggleReferrer = async (r) => {
    try {
      await api.patch(`/referrals/referrers/${r._id}/status`, { active: !r.active });
      toast.success(r.active ? 'Referrer suspended' : 'Referrer re-activated');
      reloadAll();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const reject = async () => {
    setBusy(true);
    try {
      await api.post(`/referrals/${rejecting._id}/reject`);
      toast.success('Referral rejected and points reversed');
      setRejecting(null);
      reloadAll();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const switchTab = (t) => {
    if (t === tab) return;
    list.setData(null); // avoid rendering the previous tab's rows in the new table
    setTab(t);
    setPage(1);
    setSearch('');
  };

  return (
    <>
      <PageHeader
        eyebrow="Growth"
        title="Referral programme"
        description="Track referrers, referrals and points. Fraud checks run automatically on every referral."
        actions={isSuperAdmin && <Button variant="outline" size="sm" icon={Settings2} to="/admin/settings">Point rules</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Referrers" value={s?.referrers} icon={Users} loading={!s} hint={s ? `${s.activeReferrers} with referrals` : ''} />
        <StatCard label="Valid referrals" value={s?.valid} icon={CheckCircle2} accent="sage" loading={!s} hint={s ? `${s.thisWeek} this week` : ''} />
        <StatCard label="Blocked referrals" value={s?.rejected} icon={ShieldAlert} accent="coral" loading={!s} hint="fraud & rule checks" />
        <StatCard label="Points awarded" value={s?.totalPoints} icon={Coins} accent="brand" loading={!s} hint="current balances" />
      </div>

      <div className="mt-6 grid gap-6 2xl:grid-cols-[1fr_340px]">
        <div className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-navy-100 p-4 md:flex-row md:items-center">
            <div className="inline-flex rounded-xl bg-navy-50 p-1" role="tablist">
              {[['referrers', 'Referrers'], ['referrals', 'Referrals']].map(([k, l]) => (
                <button key={k} role="tab" type="button" aria-selected={tab === k} onClick={() => switchTab(k)} className={cx('rounded-lg px-4 py-1.5 text-sm font-semibold transition', tab === k ? 'bg-white text-navy-950 shadow-soft' : 'text-navy-500')}>{l}</button>
              ))}
            </div>
            <Input className="flex-1" size="sm" icon={Search} placeholder={tab === 'referrers' ? 'Search name, email or code…' : 'Search candidate…'} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} aria-label="Search" />
            {tab === 'referrals' && (
              <Select size="sm" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} placeholder="All" aria-label="Filter by validity" className="md:w-36">
                <option value="valid">Valid</option>
                <option value="rejected">Blocked</option>
              </Select>
            )}
          </div>
          {list.error && <Alert className="m-4">{list.error}</Alert>}
          <div className="overflow-x-auto">
            {tab === 'referrers' ? (
              <table className="table-base w-full">
                <thead><tr><th>Referrer</th><th>Code</th><th>Referrals</th><th>Points</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
                <tbody>
                  {list.data?.items?.map((r) => (
                    <tr key={r._id}>
                      <td><button type="button" onClick={() => setViewing(r._id)} className="text-left"><span className="block font-semibold text-navy-900 hover:underline">{r.name}</span><span className="text-xs text-navy-400">{r.email}</span></button></td>
                      <td className="font-mono text-xs">{r.code}</td>
                      <td>{r.successfulReferrals}</td>
                      <td className="font-semibold text-navy-900">{formatNumber(r.totalPoints)}</td>
                      <td><Badge tone={r.active ? 'green' : 'red'} dot>{r.active ? 'Active' : 'Suspended'}</Badge></td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="xs" icon={PlusCircle} onClick={() => setAdjusting(r)}>Points</Button>
                          <Button variant={r.active ? 'danger-ghost' : 'ghost'} size="xs" icon={r.active ? Ban : RotateCcw} onClick={() => toggleReferrer(r)}>{r.active ? 'Suspend' : 'Restore'}</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="table-base w-full">
                <thead><tr><th>Candidate</th><th>Referrer</th><th>Role</th><th>Date</th><th>Result</th><th>Points</th><th className="text-right">Action</th></tr></thead>
                <tbody>
                  {list.data?.items?.map((r) => (
                    <tr key={r._id}>
                      <td><span className="block font-semibold text-navy-900">{r.candidateName}</span><span className="text-xs text-navy-400">{r.candidateEmail}</span></td>
                      <td>{r.referrer?.name}<span className="block font-mono text-[11px] text-navy-400">{r.referrer?.code}</span></td>
                      <td>{r.application?.roleTitle || '—'}</td>
                      <td>{formatDate(r.createdAt)}</td>
                      <td>{r.status === 'valid' ? <Badge tone="green" dot>Valid</Badge> : <Badge tone="red" dot>{REJECTION_REASONS[r.rejectionReason] || 'Blocked'}</Badge>}</td>
                      <td className="font-semibold text-navy-900">{r.pointsAwarded}</td>
                      <td className="text-right">{r.status === 'valid' && <Button variant="danger-ghost" size="xs" icon={XCircle} onClick={() => setRejecting(r)}>Reject</Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {list.loading && !list.data && <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>}
            {list.data && !list.data.items.length && <EmptyState icon={Gift} title="Nothing here yet" description="Referral activity will appear here." />}
          </div>
          {list.data && <Pagination {...list.data.pagination} onChange={setPage} />}
        </div>

        <div className="space-y-6">
          <Card title="Leaderboard" action={<Trophy className="h-5 w-5 text-brand-500" aria-hidden />}>
            <ol className="space-y-3">
              {summary.data?.leaderboard.map((r, i) => (
                <li key={r._id} className="flex items-center gap-3">
                  <span className={cx('flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold', i === 0 ? 'bg-brand-400 text-navy-950' : 'bg-navy-50 text-navy-500')}>{i + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-navy-900">{r.name}</p><p className="text-xs text-navy-400">{r.successfulReferrals} referrals</p></div>
                  <span className="text-sm font-semibold tabular-nums">{formatNumber(r.totalPoints)}</span>
                </li>
              ))}
              {summary.data && !summary.data.leaderboard.length && <p className="text-sm text-navy-400">No points awarded yet.</p>}
            </ol>
          </Card>
          <Card title="Blocked by rule" description="Automatic fraud prevention">
            <ul className="space-y-2.5">
              {summary.data?.rejectionReasons.map((r) => (
                <li key={r.reason} className="flex items-center justify-between text-sm"><span className="text-navy-600">{REJECTION_REASONS[r.reason] || r.reason}</span><span className="font-semibold">{r.count}</span></li>
              ))}
              {summary.data && !summary.data.rejectionReasons.length && <p className="text-sm text-navy-400">No blocked referrals.</p>}
            </ul>
          </Card>
          <p className="flex items-center gap-2 px-1 text-xs text-navy-400"><CalendarRange className="h-3.5 w-3.5" aria-hidden /> Points for each milestone are paid once per referral.</p>
        </div>
      </div>

      {adjusting && <AdjustModal referrer={adjusting} onClose={() => setAdjusting(null)} onDone={reloadAll} />}
      <ReferrerDrawer id={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog open={Boolean(rejecting)} onClose={() => setRejecting(null)} onConfirm={reject} loading={busy} title="Reject this referral?" message={`The referral of ${rejecting?.candidateName} will be marked invalid and ${rejecting?.pointsAwarded || 0} points will be deducted from ${rejecting?.referrer?.name}.`} confirmLabel="Reject & reverse points" />
    </>
  );
}
