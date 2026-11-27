/**
 * Distinct hero visuals for the professional-development modules.
 *  - Mentoring: mentor ↔ you, joined by a flowing path with a travelling spark
 *  - Training:  an ascending staircase of skill levels with filling progress bars
 *  - Coaching:  a target whose rings pulse toward the bullseye, goals around it
 * Decorative only (aria-hidden); the headline/intro carry the meaning.
 */
import { Award, Check, Target as TargetIcon, Sparkles } from 'lucide-react';
import { CircularText } from '../motion';
import { cx } from '../../lib/format';
import { IMAGES } from '../../content/site';

/* ------------------------------- Mentoring ------------------------------- */

function MentorLink({ content }) {
  const path = 'M150 150 C 330 120, 210 400, 400 380';
  return (
    <div className="relative mx-auto h-[540px] w-full max-w-[560px]" aria-hidden>
      <div className="absolute inset-10 rounded-full bg-gradient-to-br from-brand-100/60 via-transparent to-navy-100/70 blur-2xl" />
      <svg viewBox="0 0 560 540" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="ml-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fca23a" />
            <stop offset="1" stopColor="#2b388d" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="#e4e9fa" strokeWidth="14" strokeLinecap="round" />
        <path d={path} fill="none" stroke="url(#ml-grad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="10 12" className="animate-dash-flow" />
        <circle r="9" fill="#f7901e">
          <animateMotion dur="3.6s" repeatCount="indefinite" path={path} />
        </circle>
        <circle r="18" fill="#f7901e" opacity=".25">
          <animateMotion dur="3.6s" repeatCount="indefinite" path={path} />
        </circle>
      </svg>

      {/* mentor */}
      <figure className="group absolute left-0 top-0 w-[290px]">
        <div className="relative h-[290px] w-[290px] overflow-hidden rounded-full shadow-lift ring-[10px] ring-white transition-transform duration-700 group-hover:scale-[1.03]">
          <img src={content.image} alt="" className="h-full w-full object-cover" />
        </div>
        <figcaption className="absolute -bottom-2 left-8 rounded-full bg-navy-950 px-4 py-2 text-sm font-semibold text-white shadow-lift">Mentor</figcaption>
      </figure>

      {/* you */}
      <figure className="group absolute bottom-6 right-2 w-[210px]">
        <div className="relative h-[210px] w-[210px] overflow-hidden rounded-full shadow-lift ring-[10px] ring-white transition-transform duration-700 group-hover:scale-[1.04]">
          <img src={IMAGES.chef} alt="" className="h-full w-full object-cover" />
        </div>
        <figcaption className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-glow">You</figcaption>
      </figure>

      {/* benefits travel along the path */}
      {content.benefits.map((b, i) => {
        const pos = ['left-[300px] top-[86px]', 'left-[180px] top-[262px]', 'left-[16px] top-[400px]'][i];
        const Icon = b.icon;
        return (
          <div key={b.title} className={cx('absolute flex animate-pop-in items-center gap-2 rounded-full border border-white bg-white/95 py-2 pl-2 pr-4 shadow-lift', pos)} style={{ animationDelay: `${600 + i * 350}ms` }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-950 text-brand-300"><Icon className="h-3.5 w-3.5" /></span>
            <span className="text-sm font-semibold text-navy-900">{b.title}</span>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------- Training -------------------------------- */

function SkillLadder({ content }) {
  const steps = content.benefits;
  return (
    <div className="relative mx-auto h-[540px] w-full max-w-[580px]" aria-hidden>
      {/* photo backdrop */}
      <div className="absolute right-0 top-0 h-[300px] w-[360px] overflow-hidden rounded-[36px] shadow-lift ring-8 ring-white">
        <img src={content.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tr from-navy-950/40 to-transparent" />
      </div>

      {/* certificate badge */}
      <div className="absolute right-6 top-[250px] z-20 flex h-[120px] w-[120px] animate-float items-center justify-center rounded-full bg-white shadow-lift ring-1 ring-navy-100">
        <CircularText text="Certified · job-ready · " size={120} className="absolute inset-0 text-navy-700" />
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow"><Award className="h-6 w-6" /></span>
      </div>

      {/* ascending steps */}
      {steps.map((s, i) => {
        const Icon = s.icon;
        return (
          <div
            key={s.title}
            className="absolute z-10 w-[250px] animate-pop-in rounded-3xl bg-white p-5 shadow-lift ring-1 ring-navy-100"
            style={{ left: `${i * 70}px`, bottom: `${20 + i * 118}px`, animationDelay: `${300 + i * 250}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-xs font-bold uppercase tracking-[.18em] text-brand-600">Level {i + 1}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy-950 text-brand-300"><Icon className="h-4 w-4" /></span>
            </div>
            <p className="mt-2 font-display text-lg font-semibold text-navy-950">{s.title}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy-50">
              <div className="h-full animate-fill-bar rounded-full bg-gradient-to-r from-brand-300 to-brand-600" style={{ animationDelay: `${900 + i * 400}ms` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------- Coaching -------------------------------- */

function TargetRings({ content }) {
  const rings = [100, 80, 60, 40];
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[540px]" aria-hidden>
      {/* rings */}
      {rings.map((r, i) => (
        <div
          key={r}
          className={cx('absolute rounded-full', i % 2 ? 'bg-white shadow-soft' : 'bg-navy-50 ring-1 ring-navy-100')}
          style={{ inset: `${(100 - r) / 2}%` }}
        />
      ))}
      {/* inward pulses */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="absolute inset-[6%] animate-ring-in rounded-full border-2 border-brand-400/60" style={{ animationDelay: `${i * 1.2}s` }} />
      ))}
      {/* bullseye photo */}
      <div className="absolute inset-[34%] overflow-hidden rounded-full shadow-glow-lg ring-[6px] ring-brand-500">
        <img src={content.image} alt="" className="h-full w-full object-cover" />
      </div>
      <span className="absolute left-1/2 top-[30%] flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow">
        <TargetIcon className="h-5 w-5" />
      </span>

      {/* goals around the target */}
      {content.benefits.map((b, i) => {
        const pos = ['-left-4 top-[14%]', '-right-6 top-[44%]', 'bottom-[6%] left-[4%]'][i];
        return (
          <div key={b.title} className={cx('absolute flex animate-pop-in items-center gap-2 rounded-2xl bg-navy-950 py-2.5 pl-2.5 pr-4 text-white shadow-lift', pos)} style={{ animationDelay: `${700 + i * 400}ms` }}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300"><Check className="h-3.5 w-3.5" /></span>
            <span className="text-sm font-semibold">{b.title}</span>
          </div>
        );
      })}
      <div className="absolute right-[10%] top-[6%] flex animate-float items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-900 shadow-lift">
        <Sparkles className="h-4 w-4 text-brand-500" /> Your goals, in focus
      </div>
    </div>
  );
}

const VISUALS = { mentoring: MentorLink, training: SkillLadder, coaching: TargetRings };

export default function ModuleVisual({ module, content }) {
  const V = VISUALS[module] || MentorLink;
  return <V content={content} />;
}
