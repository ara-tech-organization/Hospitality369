import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cx } from '../../lib/format';

const VARIANTS = {
  primary:
    'shine bg-gradient-to-br from-navy-700 to-navy-950 text-white hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgba(27,36,90,.7)] shadow-[0_1px_0_rgba(255,255,255,.1)_inset,0_10px_24px_-10px_rgba(11,16,48,.6)]',
  brand:
    'shine bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600 text-white [text-shadow:0_1px_1px_rgba(120,50,0,.35)] shadow-glow hover:-translate-y-0.5 hover:shadow-glow-lg',
  outline: 'border border-navy-200 bg-white text-navy-800 hover:-translate-y-0.5 hover:border-brand-300 hover:text-navy-950 hover:shadow-soft',
  ghost: 'text-navy-600 hover:bg-navy-50 hover:text-navy-900',
  light: 'shine bg-white/10 text-white ring-1 ring-inset ring-white/20 backdrop-blur hover:-translate-y-0.5 hover:bg-white/15 hover:ring-brand-300/50',
  danger: 'bg-coral-500 text-white hover:bg-coral-600',
  'danger-ghost': 'text-coral-600 hover:bg-coral-500/10',
};

const SIZES = {
  xs: 'h-8 px-2.5 text-xs gap-1.5 rounded-lg',
  sm: 'h-9 px-3.5 text-sm gap-2 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-[52px] px-7 text-[15px] gap-2.5 rounded-2xl',
  icon: 'h-9 w-9 rounded-xl justify-center',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, to, href, icon: Icon, iconRight: IconRight, ...props },
  ref
) {
  const classes = cx(
    'group/btn inline-flex select-none items-center justify-center font-semibold transition-all duration-300 active:scale-[.98]',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className
  );
  const content = (
    <>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
      {children}
      {IconRight && !loading ? <IconRight className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover/btn:translate-x-1" aria-hidden /> : null}
    </>
  );
  if (to) return <Link ref={ref} to={to} className={classes} {...props}>{content}</Link>;
  if (href) return <a ref={ref} href={href} className={classes} {...props}>{content}</a>;
  return (
    <button ref={ref} type="button" className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
});

export default Button;
