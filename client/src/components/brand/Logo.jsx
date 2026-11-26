import { Link } from 'react-router-dom';
import { cx } from '../../lib/format';

/**
 * Official Hospitality369 logo (public/logo.webp, 237×60, transparent).
 * The wordmark is navy, so on dark backgrounds (`onDark`) it sits on a white badge.
 */
export function LogoImage({ className }) {
  return <img src="/logo.webp" alt="Hospitality369" width="237" height="60" className={cx('h-10 w-auto select-none', className)} draggable="false" />;
}

export default function Logo({ onDark = false, to = '/', className, imgClassName }) {
  return (
    <Link
      to={to}
      aria-label="Hospitality369 – home"
      className={cx(
        'group inline-flex shrink-0 items-center transition-all duration-500',
        onDark && 'rounded-2xl bg-white px-3.5 py-2 shadow-[0_10px_30px_-12px_rgba(0,0,0,.5)] ring-1 ring-white/60 hover:shadow-glow',
        className
      )}
    >
      <LogoImage className={cx('transition-transform duration-500 group-hover:scale-[1.04]', onDark ? 'h-8' : 'h-10', imgClassName)} />
    </Link>
  );
}
