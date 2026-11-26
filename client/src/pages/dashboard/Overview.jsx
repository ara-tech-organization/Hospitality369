import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { FileText, CalendarDays, CalendarRange, Users, Gift, ArrowRight, RefreshCw, Inbox } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { Card, PageHeader, StatCard } from '../../components/ui/Data';
import { Alert, EmptyState, StatusBadge, Badge } from '../../components/ui/Feedback';
import Button from '../../components/ui/Button';
import { PERMISSIONS as P, STATUS_MAP, INDUSTRY_LABEL } from '../../lib/constants';
import { formatNumber, timeAgo, initials } from '../../lib/format';

// Single-hue chart tokens (one series per chart → identity never relies on colour)
const C = { line: '#e8730f', fill: '#f7901e', bar: '#2b388d', barHi: '#f7901e', grid: '#e4e9fa', axis: '#9eade8' };

const axisProps = { tick: { fill: C.axis, fontSize: 12 }, axisLine: false, tickLine: false };

function ChartTooltip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-navy-100 bg-white px-3 py-2 shadow-lift">
      <p className="text-xs text-navy-400">{fmt ? fmt(label) : label}</p>
      <p className="text-sm font-semibold text-navy-900">{formatNumber(payload[0].value)} application{payload[0].value === 1 ? '' : 's'}</p>
    </div>
  );
}

const shortDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export default function Overview() {
  const { user, can } = useAuth();
  const { data, loading, error, reload } = useApi('/dashboard/overview');
  const s = data?.stats;
  const delta = s && s.lastWeek ? Math.round(((s.thisWeek - s.lastWeek) / s.lastWeek) * 100) : null;
  const trendTotal = data?.trend.reduce((a, b) => a + b.count, 0) || 0;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${user.name.split(' ')[0]}`}
        description="Recruitment performance across hotels, restaurants, bars and banquet halls."
        actions={
          <>
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={reload} loading={loading && !!data}>Refresh</Button>
            {can(P.CANDIDATES_VIEW) && <Button size="sm" to="/admin/candidates" iconRight={ArrowRight}>All candidates</Button>}
          </>
        }
      />
      {error && <Alert className="mb-6">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total applications" value={s?.total} icon={FileText} loading={!s} hint="all time" />
        <StatCard label="Applications today" value={s?.today} icon={CalendarDays} accent="brand" loading={!s} hint="since midnight" />
        <StatCard label="This week" value={s?.thisWeek} icon={CalendarRange} accent="sage" loading={!s} delta={delta} hint="vs last week" />
        <StatCard label="Total candidates" value={s?.candidates} icon={Users} accent="coral" loading={!s} hint={s ? `${formatNumber(s.hired)} hired` : ''} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Application trend" description={`Daily applications · last 30 days · ${formatNumber(trendTotal)} total`}>
          <div className="h-72" role="img" aria-label={`Line chart of daily applications over the last 30 days, ${trendTotal} in total`}>
            {data && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.fill} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={C.fill} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={C.grid} strokeDasharray="0" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={shortDate} {...axisProps} minTickGap={24} />
                  <YAxis allowDecimals={false} {...axisProps} />
                  <Tooltip content={<ChartTooltip fmt={shortDate} />} cursor={{ stroke: C.axis, strokeDasharray: '3 3' }} />
                  <Area isAnimationActive={false} type="monotone" dataKey="count" stroke={C.line} strokeWidth={2} fill="url(#trendFill)" activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: C.line }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
            {!data && <div className="skeleton h-full w-full" />}
          </div>
        </Card>

        <Card title="Pipeline" description="Applications by status">
          {data ? (
            <ul className="space-y-3.5">
              {data.byStatus.map((st) => {
                const max = Math.max(1, ...data.byStatus.map((x) => x.count));
                return (
                  <li key={st.status}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-medium text-navy-700">{STATUS_MAP[st.status].label}</span>
                      <span className="font-semibold tabular-nums text-navy-900">{formatNumber(st.count)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-navy-50" title={`${STATUS_MAP[st.status].label}: ${st.count}`}>
                      <div className="h-full rounded-full bg-navy-700 transition-all duration-700" style={{ width: `${(st.count / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="space-y-4">{Array.from({ length: 7 }).map((_, i) => <div key={i} className="skeleton h-6" />)}</div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Applications by role" description="Top roles by total applications">
          <div style={{ height: Math.max(220, (data?.byRole.length || 6) * 38) }} role="img" aria-label="Bar chart of applications per role">
            {data?.byRole.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byRole} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }} barCategoryGap={8}>
                  <CartesianGrid stroke={C.grid} horizontal={false} />
                  <XAxis type="number" allowDecimals={false} {...axisProps} />
                  <YAxis type="category" dataKey="title" width={150} {...axisProps} tick={{ fill: '#2b388d', fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(247,144,30,.08)' }} />
                  <Bar isAnimationActive={false} dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {data.byRole.map((r, i) => <Cell key={r.roleId} fill={i === 0 ? C.barHi : C.bar} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : data ? (
              <EmptyState icon={Inbox} title="No applications yet" description="Role statistics will appear once candidates apply." />
            ) : (
              <div className="skeleton h-full w-full" />
            )}
          </div>
        </Card>

        <Card
          title="Available roles"
          description={s ? `${s.activeRoles} active of ${s.totalRoles}` : ''}
          action={can(P.ROLES_MANAGE) && <Link to="/admin/roles" className="text-sm font-semibold text-brand-700 hover:text-brand-600">Manage</Link>}
        >
          <ul className="max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {data?.roles.map((r) => (
              <li key={r._id} className="flex items-center justify-between rounded-xl bg-navy-50/60 px-3 py-2.5">
                <span className="text-sm font-medium text-navy-800">{r.title}</span>
                <Badge tone="slate">{INDUSTRY_LABEL[r.industry]}</Badge>
              </li>
            ))}
            {data && !data.roles.length && <p className="text-sm text-navy-400">No active roles.</p>}
          </ul>
          {s && can(P.REFERRALS_MANAGE) && (
            <Link to="/admin/referrals" className="mt-5 flex items-center gap-3 rounded-2xl bg-brand-50 p-4 ring-1 ring-brand-100 transition hover:bg-brand-100/60">
              <Gift className="h-5 w-5 text-brand-600" aria-hidden />
              <span className="text-sm text-navy-700"><b className="text-navy-900">{formatNumber(s.validReferrals)}</b> valid referrals from <b className="text-navy-900">{formatNumber(s.referrers)}</b> referrers</span>
            </Link>
          )}
        </Card>
      </div>

      {data?.recent && (
        <Card
          className="mt-6"
          title="Recent applications"
          padded={false}
          action={<Link to="/admin/candidates" className="text-sm font-semibold text-brand-700 hover:text-brand-600">View all</Link>}
        >
          {data.recent.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="table-base w-full">
                <thead><tr><th>Candidate</th><th>Role</th><th>Position</th><th>Status</th><th className="text-right">Applied</th></tr></thead>
                <tbody>
                  {data.recent.map((a) => (
                    <tr key={a._id}>
                      <td>
                        <Link to={`/admin/candidates?open=${a._id}`} className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-950 text-xs font-bold text-brand-300">{initials(a.fullName)}</span>
                          <span><span className="block font-semibold text-navy-900">{a.fullName}</span><span className="text-xs text-navy-400">{a.email}</span></span>
                        </Link>
                      </td>
                      <td>{a.roleTitle}</td>
                      <td>{a.position}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td className="text-right text-navy-400">{timeAgo(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={Inbox} title="No applications yet" />
          )}
        </Card>
      )}
      {!data && loading && <div className="skeleton mt-6 h-64 rounded-2xl" />}
    </>
  );
}
