/* Dashboard building blocks – Google Material (Workspace) style */
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { cx, formatNumber } from '../../lib/format';

export function Card({ className, children, title, description, action, padded = true }) {
  return (
    <section className={cx('card', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-6 pt-5">
          <div>
            {title && <h2 className="text-[16px] font-medium text-navy-900">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-navy-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? 'p-6' : ''}>{children}</div>
    </section>
  );
}

/** Tonal icon colours (Material "container" colours) */
const ACCENTS = {
  ink: 'bg-[#d3e3fd] text-[#041e49]',
  brand: 'bg-brand-100 text-brand-800',
  sage: 'bg-[#c4eed0] text-[#0d652d]',
  coral: 'bg-[#fad2cf] text-[#8c1d18]',
};

export function StatCard({ label, value, icon: Icon, hint, delta, accent = 'ink', loading }) {
  return (
    <div className="card group p-5 transition-colors hover:bg-[#f8fafd]">
      <div className="flex items-center gap-3">
        {Icon && (
          <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', ACCENTS[accent])}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        )}
        <p className="text-[14px] font-medium text-navy-600">{label}</p>
      </div>
      {loading ? (
        <div className="skeleton mt-4 h-9 w-24" />
      ) : (
        <p className="mt-4 text-[36px] font-normal leading-none tracking-[-.01em] text-navy-950">{typeof value === 'number' ? formatNumber(value) : value}</p>
      )}
      {(hint || delta !== undefined) && !loading && (
        <div className="mt-3 flex items-center gap-2 text-[13px]">
          {delta !== undefined && delta !== null && (
            <span className={cx('inline-flex items-center gap-1 font-medium', delta >= 0 ? 'text-[#137333]' : 'text-[#c5221f]')}>
              {delta >= 0 ? <TrendingUp className="h-4 w-4" aria-hidden /> : <TrendingDown className="h-4 w-4" aria-hidden />}
              {delta >= 0 ? '+' : ''}
              {delta}%
            </span>
          )}
          {hint && <span className="text-navy-500">{hint}</span>}
        </div>
      )}
    </div>
  );
}

export function Pagination({ page, pages, total, limit, onChange }) {
  if (!total) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  return (
    <nav className="flex items-center justify-end gap-2 border-t border-[#e3e6ea] px-4 py-2 text-[13px] text-navy-600" aria-label="Pagination">
      <span className="mr-2 tabular-nums">
        {from}–{to} of {formatNumber(total)}
      </span>
      <PageBtn disabled={page <= 1} onClick={() => onChange(page - 1)} label="Newer">
        <ChevronLeft className="h-5 w-5" />
      </PageBtn>
      <PageBtn disabled={page >= pages} onClick={() => onChange(page + 1)} label="Older">
        <ChevronRight className="h-5 w-5" />
      </PageBtn>
    </nav>
  );
}

function PageBtn({ children, disabled, onClick, label }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-full text-navy-700 transition hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-[#e3e6ea] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[28px] font-normal leading-tight text-navy-950">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[14px] text-navy-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
