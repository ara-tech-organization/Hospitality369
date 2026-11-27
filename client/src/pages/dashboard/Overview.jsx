/**
 * Dashboard overview – Google Analytics / Admin console style:
 * greeting + assist chips, a scorecard with trend chart, "Needs your attention",
 * hiring pipeline, applications by role, and Gmail-style recent applications.
 */
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  ArrowRight, RefreshCw, Inbox, Users, Briefcase, MessageSquareText, FileSpreadsheet, TrendingUp, TrendingDown,
  CheckCircle2, ChevronRight, Sparkles,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { Alert, EmptyState, StatusBadge, Skeleton } from '../../components/ui/Feedback';
import { PERMISSIONS as P, STATUS_MAP, INDUSTRY_LABEL } from '../../lib/constants';
import { formatNumber, timeAgo, initials, cx } from '../../lib/format';
import { useLiveRefresh } from '../../context/RealtimeContext';

const ORANGE = '#e8730f';
const shortDate = (d) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** Material "assist chip" */
function Chip({ icon: Icon, children, to }) {
  return (
    <Link to={to} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#c4c7c5] bg-white px-3 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f1f3f4] hover:shadow-[0_1px_2px_rgba(60,64,67,.3)]">
      <Icon className="h-4 w-4 text-brand-600" aria-hidden />
      {children}
    </Link>
  );
}

function Panel({ title, subtitle, action, children, className }) {
  return (
    <section className={cx('rounded-2xl border border-[#e3e6ea] bg-white', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
          <div>
            <h2 className="text-[16px] font-medium text-[#1f1f1f]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-[#444746]">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[#303134] px-3 py-2 text-white shadow-lg">
      <p className="text-[11px] text-[#bdc1c6]">{shortDate(label)}</p>
      <p className="text-sm font-medium">{formatNumber(payload[0].value)} application{payload[0].value === 1 ? '' : 's'}</p>
    </div>
  );
}

/** Google Analytics-style scorecard: metric tabs on top, trend chart below */
function Scorecard({ data }) {
  const [range, setRange] = useState(30);
  const s = data?.stats;
  const trend = useMemo(() => (data?.trend || []).slice(-range), [data, range]);
  const inRange = trend.reduce((a, b) => a + b.count, 0);
  const delta = s && s.lastWeek ? Math.round(((s.thisWeek - s.lastWeek) / s.lastWeek) * 100) : null;
  const metrics = [
    { label: `Applications (${range}d)`, value: inRange, active: true },
    { label: 'Today', value: s?.today },
    { label: 'This week', value: s?.thisWeek, delta },
    { label: 'Hired', value: s?.hired },
  ];

  return (
    <Panel className="min-w-0 overflow-hidden">
      <div className="grid grid-cols-2 border-b border-[#e3e6ea] md:grid-cols-4">
        {metrics.map((m, i) => (
          <div key={m.label} className={cx('relative px-5 py-4', i > 0 && 'md:border-l md:border-[#e3e6ea]', i % 2 === 1 && 'border-l border-[#e3e6ea] md:border-l', i >= 2 && 'border-t border-[#e3e6ea] md:border-t-0')}>
            {m.active && <span className="absolute inset-x-0 top-0 h-[3px] bg-brand-500" aria-hidden />}
            <p className={cx('text-[13px] font-medium', m.active ? 'text-brand-700' : 'text-[#444746]')}>{m.label}</p>
            {s ? <p className="mt-1 text-[32px] leading-tight text-[#1f1f1f]">{formatNumber(m.value || 0)}</p> : <Skeleton className="mt-2 h-8 w-16" />}
            {m.delta !== undefined && m.delta !== null && s && (
              <p className={cx('mt-0.5 flex items-center gap-1 text-[12px] font-medium', m.delta >= 0 ? 'text-[#137333]' : 'text-[#c5221f]')}>
                {m.delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {m.delta >= 0 ? '+' : ''}{m.delta}% vs last week
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-5 pt-4">
        <p className="text-[13px] text-[#444746]">Daily applications</p>
        <div className="inline-flex rounded-full border border-[#c4c7c5] p-0.5" role="group" aria-label="Date range">
          {[7, 14, 30].map((d) => (
            <button key={d} type="button" onClick={() => setRange(d)} aria-pressed={range === d} className={cx('rounded-full px-3 py-1 text-[12px] font-medium transition', range === d ? 'bg-brand-100 text-brand-800' : 'text-[#444746] hover:bg-[#f1f3f4]')}>
              {d} days
            </button>
          ))}
        </div>
      </div>
      <div className="h-64 px-2 pb-3 pt-2" role="img" aria-label={`Line chart of daily applications over the last ${range} days, ${inRange} in total`}>
        {data ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 8, right: 16, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="ov-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ORANGE} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#eceef1" vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: '#5f6368', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} />
              <YAxis allowDecimals={false} tick={{ fill: '#5f6368', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: '#9aa0a6', strokeDasharray: '3 3' }} />
              <Area isAnimationActive={false} type="monotone" dataKey="count" stroke={ORANGE} strokeWidth={2} fill="url(#ov-fill)" activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: ORANGE }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>
    </Panel>
  );
}

export default function Overview() {
  const { user, can } = useAuth();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi('/dashboard/overview');
  useLiveRefresh(['applications', 'enquiries', 'roles'], reload);
  const s = data?.stats;
  const byStatus = Object.fromEntries((data?.byStatus || []).map((x) => [x.status, x.count]));
  const maxStatus = Math.max(1, ...(data?.byStatus || []).map((x) => x.count));
  const maxRole = Math.max(1, ...(data?.byRole || []).map((x) => x.count));

  const attention = [
    can(P.CANDIDATES_VIEW) && { n: byStatus.new || 0, label: 'new applications waiting for review', to: '/admin/candidates?status=new', icon: Users, tone: 'bg-[#fce8e6] text-[#c5221f]' },
    can(P.CANDIDATES_VIEW) && { n: byStatus.interview || 0, label: 'candidates at interview stage', to: '/admin/candidates?status=interview', icon: Briefcase, tone: 'bg-[#fef7e0] text-[#b06000]' },
    can(P.ENQUIRIES_VIEW) && { n: s?.newEnquiries || 0, label: 'new enquiries & messages', to: '/admin/enquiries', icon: MessageSquareText, tone: 'bg-[#e8f0fe] text-[#1967d2]' },
  ].filter(Boolean);
  const allClear = s && attention.every((a) => !a.n);

  return (
    <div className="space-y-5">
      {/* ---------------- greeting ---------------- */}
      <div className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-normal text-[#1f1f1f]">
            {greeting()}, {user.name.split(' ')[0]}
          </h1>
          <p className="mt-1 text-[14px] text-[#444746]">Here&apos;s what&apos;s happening with hospitality hiring today.</p>
        </div>
        <button type="button" onClick={reload} className="inline-flex h-9 w-fit items-center gap-2 rounded-full px-3 text-sm font-medium text-brand-700 hover:bg-brand-50" disabled={loading}>
          <RefreshCw className={cx('h-4 w-4', loading && data && 'animate-spin')} aria-hidden /> Refresh
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {can(P.CANDIDATES_VIEW) && <Chip icon={Users} to="/admin/candidates">View candidates</Chip>}
        {can(P.ROLES_MANAGE) && <Chip icon={Briefcase} to="/admin/roles?new=1">Add a role</Chip>}
        {can(P.CANDIDATES_EXPORT) && <Chip icon={FileSpreadsheet} to="/admin/candidates">Export report</Chip>}
        {can(P.ENQUIRIES_VIEW) && <Chip icon={MessageSquareText} to="/admin/enquiries">Enquiries</Chip>}
      </div>

      {error && <Alert>{error}</Alert>}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Scorecard data={data} />

        {/* ---------------- needs attention ---------------- */}
        <Panel title="Needs your attention" subtitle={allClear ? 'You’re all caught up' : 'Items waiting on your team'}>
          {!s ? (
            <div className="space-y-3 p-5">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : allClear ? (
            <div className="flex flex-col items-center px-5 pb-8 pt-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-[#1e8e3e]" aria-hidden />
              <p className="mt-3 font-medium text-[#1f1f1f]">Inbox zero</p>
              <p className="text-sm text-[#444746]">Nothing needs action right now.</p>
            </div>
          ) : (
            <ul className="px-2 pb-3">
              {attention.map(({ n, label, to, icon: Icon, tone }) => (
                <li key={label}>
                  <button type="button" onClick={() => navigate(to)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-[#f1f3f4]">
                    <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', tone)}><Icon className="h-5 w-5" aria-hidden /></span>
                    <span className="flex-1 text-[14px] text-[#1f1f1f]">
                      <span className="text-[20px] font-medium">{formatNumber(n)}</span> {label}
                    </span>
                    <ChevronRight className="h-5 w-5 text-[#5f6368] transition group-hover:translate-x-0.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {s && (
            <div className="mx-5 mb-5 flex items-center gap-3 rounded-xl bg-[#f8fafd] px-4 py-3 text-[13px] text-[#444746]">
              <Sparkles className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              <span><b className="font-medium text-[#1f1f1f]">{s.activeRoles}</b> of {s.totalRoles} roles are live on the website · <b className="font-medium text-[#1f1f1f]">{formatNumber(s.candidates)}</b> candidates in total</span>
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---------------- pipeline ---------------- */}
        <Panel title="Hiring pipeline" subtitle="Applications by stage">
          <ul className="space-y-3 px-5 pb-5 pt-2">
            {(data?.byStatus || []).map((st) => (
              <li key={st.status}>
                <button
                  type="button"
                  onClick={() => can(P.CANDIDATES_VIEW) && navigate(`/admin/candidates?status=${st.status}`)}
                  className="group grid w-full grid-cols-[96px_1fr_40px] items-center gap-3 text-left"
                  title={`${STATUS_MAP[st.status].label}: ${st.count}`}
                >
                  <span className="text-[13px] text-[#444746] group-hover:text-[#1f1f1f]">{STATUS_MAP[st.status].label}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-[#eceef1]">
                    <span className="block h-full rounded-full bg-navy-700 transition-all duration-700 group-hover:bg-brand-500" style={{ width: `${(st.count / maxStatus) * 100}%` }} />
                  </span>
                  <span className="text-right text-[13px] font-medium tabular-nums text-[#1f1f1f]">{st.count}</span>
                </button>
              </li>
            ))}
            {!data && Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-5" />)}
          </ul>
        </Panel>

        {/* ---------------- by role ---------------- */}
        <Panel
          title="Applications by role"
          subtitle="Most applied-for roles"
          action={can(P.ROLES_MANAGE) && <Link to="/admin/roles" className="rounded-full px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50">Manage roles</Link>}
        >
          {data && !data.byRole.length ? (
            <EmptyState icon={Inbox} title="No applications yet" />
          ) : (
            <ul className="space-y-3 px-5 pb-5 pt-2">
              {(data?.byRole || []).slice(0, 7).map((r, i) => (
                <li key={r.roleId || r.title} className="grid grid-cols-[minmax(0,140px)_1fr_40px] items-center gap-3">
                  <span className="truncate text-[13px] text-[#444746]" title={r.title}>{r.title}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-[#eceef1]">
                    <span className={cx('block h-full rounded-full', i === 0 ? 'bg-brand-500' : 'bg-navy-700')} style={{ width: `${(r.count / maxRole) * 100}%` }} />
                  </span>
                  <span className="text-right text-[13px] font-medium tabular-nums text-[#1f1f1f]">{r.count}</span>
                </li>
              ))}
              {!data && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5" />)}
            </ul>
          )}
        </Panel>
      </div>

      {/* ---------------- recent (Gmail-style rows) ---------------- */}
      {data?.recent && (
        <Panel
          title="Recent applications"
          action={<Link to="/admin/candidates" className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50">View all <ArrowRight className="h-4 w-4" /></Link>}
        >
          {data.recent.length ? (
            <ul className="border-t border-[#e3e6ea]">
              {data.recent.map((a) => (
                <li key={a._id}>
                  <Link
                    to={`/admin/candidates?open=${a._id}`}
                    className="group flex items-center gap-4 border-b border-[#eceef1] px-5 py-3 transition last:border-b-0 hover:z-10 hover:shadow-[inset_1px_0_0_#dadce0,inset_-1px_0_0_#dadce0,0_1px_2px_0_rgba(60,64,67,.3),0_1px_3px_1px_rgba(60,64,67,.15)]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-950 text-xs font-semibold text-white">{initials(a.fullName)}</span>
                    <span className={cx('w-44 shrink-0 truncate text-[14px] text-[#1f1f1f]', a.status === 'new' ? 'font-bold' : 'font-medium')}>{a.fullName}</span>
                    <span className="min-w-0 flex-1 truncate text-[14px] text-[#444746]">
                      <span className="text-[#1f1f1f]">{a.roleTitle}</span>
                      {a.position && <span> — {a.position}</span>}
                    </span>
                    <span className="hidden sm:block"><StatusBadge status={a.status} /></span>
                    <span className={cx('w-16 shrink-0 text-right text-[12px]', a.status === 'new' ? 'font-bold text-[#1f1f1f]' : 'text-[#444746]')}>{timeAgo(a.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Inbox} title="No applications yet" />
          )}
        </Panel>
      )}

      {/* live roles as chips */}
      {data?.roles?.length > 0 && (
        <Panel title="Live roles" subtitle={`${data.roles.length} roles visible on the application form`}>
          <div className="flex flex-wrap gap-2 px-5 pb-5 pt-1">
            {data.roles.map((r) => (
              <span key={r._id} className="inline-flex items-center gap-2 rounded-lg border border-[#c4c7c5] px-3 py-1.5 text-[13px] text-[#1f1f1f]">
                <span className="h-2 w-2 rounded-full bg-[#1e8e3e]" aria-hidden />
                {r.title}
                <span className="text-[#5f6368]">· {INDUSTRY_LABEL[r.industry]}</span>
              </span>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
