import { Loader2 } from 'lucide-react';
import { cx } from '../../lib/format';
import { STATUS_MAP } from '../../lib/constants';

const TONES = {
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  teal: 'bg-teal-50 text-teal-700 ring-teal-600/15',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  slate: 'bg-navy-50 text-navy-600 ring-navy-500/15',
};

export function Badge({ tone = 'slate', children, className, dot }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || { label: status, tone: 'slate' };
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

export function Spinner({ className, label = 'Loading' }) {
  return (
    <span role="status" className={cx('inline-flex items-center gap-2 text-navy-400', className)}>
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="scale-125" />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-16 text-center', className)}>
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 ring-1 ring-brand-200">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      )}
      <h3 className="font-sans text-base font-semibold text-navy-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-navy-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Alert({ tone = 'error', title, children, className }) {
  const styles = {
    error: 'border-coral-400/30 bg-coral-500/5 text-coral-600',
    success: 'border-sage-400/40 bg-sage-400/10 text-sage-600',
    info: 'border-brand-200 bg-brand-50 text-brand-800',
  };
  return (
    <div className={cx('rounded-xl border px-4 py-3 text-sm', styles[tone], className)} role={tone === 'error' ? 'alert' : 'status'}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={title ? 'mt-0.5 opacity-90' : ''}>{children}</div>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cx('skeleton', className)} aria-hidden />;
}
