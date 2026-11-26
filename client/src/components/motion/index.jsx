import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { cx } from '../../lib/format';

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Shared IntersectionObserver hook – fires once when the element enters the viewport */
export function useInView({ threshold = 0.15, rootMargin = '0px 0px -60px 0px' } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return undefined;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, inView]);
  return [ref, inView];
}

/** Fade + rise into view on scroll. `delay` in ms for staggering. */
export function Reveal({ as = 'div', delay = 0, className, style, children, ...props }) {
  const [ref, inView] = useInView();
  return createElement(
    as,
    { ...props, ref, className: cx('reveal', inView && 'is-visible', className), style: { '--d': `${delay}ms`, ...style } },
    children
  );
}

/** Track the cursor inside an element and expose it as --mx / --my CSS variables */
export function useSpotlight() {
  return useCallback((e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, []);
}

/** Card with cursor-following glow and a gradient border that lights up on hover */
export function SpotlightCard({ as = 'div', className, children, ...props }) {
  const onMove = useSpotlight();
  return createElement(as, { onMouseMove: onMove, className: cx('spotlight', className), ...props }, children);
}

/** Subtle 3D tilt that follows the pointer */
export function Tilt({ className, children, max = 8 }) {
  const ref = useRef(null);
  const frame = useRef(0);
  const onMove = (e) => {
    if (reducedMotion()) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(1000px) rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
    });
  };
  const reset = () => {
    cancelAnimationFrame(frame.current);
    if (ref.current) ref.current.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={reset} className={cx('transition-transform duration-300 ease-out [transform-style:preserve-3d]', className)}>
      {children}
    </div>
  );
}

/** Animated number that counts up when scrolled into view */
export function CountUp({ end, duration = 1800, prefix = '', suffix = '', className }) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    if (reducedMotion()) {
      setValue(end);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 4;
      setValue(Math.round(end * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);
  return (
    <span ref={ref} className={className} aria-label={`${prefix}${end}${suffix}`}>
      <span aria-hidden>{prefix}{value.toLocaleString()}{suffix}</span>
    </span>
  );
}

/** Cycles through words with a blur-in animation */
export function RotatingWords({ words, interval = 2400, className }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reducedMotion()) return undefined;
    const t = setInterval(() => setI((x) => (x + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);
  // className (e.g. gradient text) goes on the visible word only – background-clip:text
  // on the wrapper would also paint the hidden width-reserving word.
  return (
    <span className="relative inline-grid whitespace-nowrap">
      {/* Reserve width of the longest word to avoid layout shift */}
      <span className="invisible col-start-1 row-start-1 font-semibold" aria-hidden>{words.reduce((a, b) => (b.length > a.length ? b : a))}</span>
      <span key={i} className={cx('col-start-1 row-start-1 animate-word-in', className)} aria-live="off">{words[i]}</span>
      <span className="sr-only">{words.join(', ')}</span>
    </span>
  );
}

/** Hexagon-shaped icon tile – echoes the logo mark */
export function HexIcon({ icon: Icon, className, tone = 'brand', size = 'md' }) {
  const sizes = { sm: 'h-11 w-10', md: 'h-14 w-12', lg: 'h-[72px] w-16' };
  const tones = {
    brand: 'bg-gradient-to-br from-brand-400 to-brand-600 text-white',
    navy: 'bg-gradient-to-br from-navy-700 to-navy-950 text-brand-300',
    light: 'bg-white/10 text-brand-300',
    soft: 'bg-brand-50 text-brand-600',
  };
  return (
    <span className={cx('hex inline-flex shrink-0 items-center justify-center transition-transform duration-500', sizes[size], tones[tone], className)}>
      <Icon className={size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'} aria-hidden />
    </span>
  );
}

/** Thin progress bar showing page scroll position */
export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? h.scrollTop / max : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  return <div className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-brand-400 via-brand-500 to-navy-500" style={{ transform: `scaleX(${p})` }} aria-hidden />;
}

/** Pulls its child gently toward the cursor (luxury "magnetic" CTA) */
export function Magnetic({ children, strength = 0.35, className }) {
  const ref = useRef(null);
  const onMove = (e) => {
    if (reducedMotion()) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = 'translate3d(0,0,0)';
  };
  return (
    <span ref={ref} onMouseMove={onMove} onMouseLeave={reset} className={cx('inline-block transition-transform duration-300 ease-out', className)}>
      {children}
    </span>
  );
}

/** Headline lines that slide up from behind a mask, staggered */
export function LineReveal({ lines, className, lineClassName, delay = 0, step = 110 }) {
  return (
    <span className={cx('block', className)}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[.08em]">
          <span className={cx('block animate-line-up', lineClassName)} style={{ animationDelay: `${delay + i * step}ms` }}>
            {line}
          </span>
        </span>
      ))}
    </span>
  );
}

/**
 * Mouse parallax: attach the returned handlers to a container; children read
 * --px / --py (-1..1) via the `parallax(depth)` style helper.
 */
export function useParallax() {
  const frame = useRef(0);
  const onMouseMove = useCallback((e) => {
    if (reducedMotion()) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--px', px.toFixed(3));
      el.style.setProperty('--py', py.toFixed(3));
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  }, []);
  const onMouseLeave = useCallback((e) => {
    e.currentTarget.style.setProperty('--px', '0');
    e.currentTarget.style.setProperty('--py', '0');
  }, []);
  return { onMouseMove, onMouseLeave };
}

export const parallax = (depth) => ({
  transform: `translate3d(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth}px), 0)`,
  transition: 'transform .6s cubic-bezier(.16,1,.3,1)',
});

/** Circular progress ring that animates when scrolled into view */
export function Ring({ value, size = 120, stroke = 10, className, children }) {
  const [ref, inView] = useInView({ threshold: 0.4 });
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div ref={ref} className={cx('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fca23a" />
            <stop offset="1" stopColor="#e8730f" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeOpacity=".1" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={inView ? c * (1 - value / 100) : c}
          style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(.16,1,.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/**
 * Words light up one by one as the block scrolls through the viewport
 * (scroll-linked "manifesto" text).
 */
export function ScrollText({ text, className, highlight = [] }) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(reducedMotion() ? 1 : 0);
  useEffect(() => {
    if (reducedMotion()) return undefined;
    let raf;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 when the block's top hits 85% of viewport, 1 when its bottom reaches 45%
        const start = vh * 0.85;
        const end = vh * 0.45;
        const p = (start - r.top) / (start - end + r.height);
        setProgress(Math.max(0, Math.min(1, p)));
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
  const words = text.split(' ');
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => {
        const on = i / words.length < progress;
        const hi = highlight.includes(w.replace(/[^\w]/g, '').toLowerCase());
        return (
          <span
            key={i}
            className={cx('transition-colors duration-300', on ? (hi ? 'text-brand-500' : 'text-navy-950') : 'text-navy-950/[.12]')}
          >
            {w}{' '}
          </span>
        );
      })}
    </p>
  );
}

/** Text laid out on a circle that rotates slowly – used for badges & round CTAs */
export function CircularText({ text, size = 140, className, textClassName = 'fill-current' }) {
  const id = useRef(`ct-${Math.random().toString(36).slice(2)}`).current;
  const r = size / 2 - 12;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className={cx('animate-spin-slow', className)} aria-hidden>
      <defs>
        <path id={id} d={`M ${size / 2},${size / 2} m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`} />
      </defs>
      <text className={textClassName} style={{ fontSize: 11.5, letterSpacing: '.28em', fontWeight: 700, textTransform: 'uppercase' }}>
        <textPath href={`#${id}`}>{text}</textPath>
      </text>
    </svg>
  );
}

/** Image card that follows the cursor inside a container (agency-style hover preview) */
export function useCursorFollower() {
  const box = useRef(null);
  const follower = useRef(null);
  const onMouseMove = useCallback((e) => {
    if (!box.current || !follower.current) return;
    const r = box.current.getBoundingClientRect();
    follower.current.style.transform = `translate3d(${e.clientX - r.left}px, ${e.clientY - r.top}px, 0) translate(-50%, -50%)`;
  }, []);
  return { box, follower, onMouseMove };
}
