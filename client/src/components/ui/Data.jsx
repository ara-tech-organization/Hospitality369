import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cx, formatNumber } from '../../lib/format';

export function Card({ className, children, title, description, action, padded = true }) {
  return (
    <section className={cx('card', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5">
          <div>
            {title && <h2 className="font-sans text-[15px] font-semibold text-navy-900">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-navy-400">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? 'p-6' : ''}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, icon: Icon, hint, delta, accent = 'ink', loading }) {
  const accents = {
    ink: 'from-navy-800 to-navy-950 text-brand-300',
    brand: 'from-brand-300 to-brand-500 text-navy-950',
    sage: 'from-sage-400 to-sage-600 text-white',
    coral: 'from-coral-400 to-coral-600 text-white',
  };
  return (
    <div className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-100/40 blur-2xl transition group-hover:bg-brand-200/60" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-navy-400">{label}</p>
          {loading ? (
            <div className="skeleton mt-2 h-8 w-20" />
          ) : (
            <p className="mt-1.5 font-display text-3xl font-medium text-navy-950">{typeof value === 'number' ? formatNumber(value) : value}</p>
          )}
        </div>
        {Icon && (
          <div className={cx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-soft', accents[accent])}>
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        )}
      </div>
      {(hint || delta !== undefined) && !loading && (
        <div className="relative mt-3 flex items-center gap-2 text-xs">
          {delta !== undefined && delta !== null && (
            <span className={cx('inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold', delta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
              {delta >= 0 ? <TrendingUp className="h-3 w-3" aria-hidden /> : <TrendingDown className="h-3 w-3" aria-hidden />}
              {delta >= 0 ? '+' : ''}
              {delta}%
            </span>
          )}
          {hint && <span className="text-navy-400">{hint}</span>}
        </div>
      )}
    </div>
  );
}

export function Pagination({ page, pages, total, limit, onChange }) {
  if (!total) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  const nums = [];
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  for (let i = start; i <= Math.min(pages, start + 4); i += 1) nums.push(i);
  return (
    <nav className="flex flex-col items-center justify-between gap-3 border-t border-navy-100 px-4 py-3 sm:flex-row" aria-label="Pagination">
      <p className="text-[13px] text-navy-400">
        Showing <span className="font-semibold text-navy-700">{from}</span>–<span className="font-semibold text-navy-700">{to}</span> of{' '}
        <span className="font-semibold text-navy-700">{formatNumber(total)}</span>
      </p>
      <div className="flex items-center gap-1">
        <PageBtn disabled={page <= 1} onClick={() => onChange(page - 1)} label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </PageBtn>
        {nums.map((n) => (
          <PageBtn key={n} active={n === page} onClick={() => onChange(n)} label={`Page ${n}`}>
            {n}
          </PageBtn>
        ))}
        <PageBtn disabled={page >= pages} onClick={() => onChange(page + 1)} label="Next page">
          <ChevronRight className="h-4 w-4" />
        </PageBtn>
      </div>
    </nav>
  );
}

function PageBtn({ children, active, disabled, onClick, label }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cx(
        'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-semibold transition disabled:opacity-40',
        active ? 'bg-navy-950 text-white' : 'text-navy-600 hover:bg-navy-50'
      )}
    >
      {children}
    </button>
  );
}

export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-[28px] font-medium leading-tight sm:text-[32px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-navy-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
