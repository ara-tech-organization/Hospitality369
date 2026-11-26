import { cx } from '../../lib/format';

/** Editorial section marker: "( 02 ) —— Pathways" */
export default function SectionIndex({ n, label, dark, className }) {
  return (
    <p className={cx('flex items-center gap-3 font-display text-sm font-semibold uppercase tracking-[.2em]', dark ? 'text-navy-300' : 'text-navy-400', className)}>
      <span className="text-brand-500">( {n} )</span>
      <span className={cx('h-px w-10', dark ? 'bg-white/20' : 'bg-navy-200')} />
      {label}
    </p>
  );
}
