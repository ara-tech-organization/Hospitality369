import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, X, RotateCcw, Copy } from 'lucide-react';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';

/** Celebratory centred popup shown after an application is submitted */
export default function SuccessDialog({ open, result, onClose, onApplyAgain }) {
  const toast = useToast();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => closeRef.current?.focus(), 50);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !result) return null;
  const ref = result.application.reference;
  const firstName = result.message.match(/Thank you, ([^!]+)!/)?.[1];

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(ref);
      toast.success('Reference copied');
    } catch {
      toast.error('Could not copy – please note it down');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 animate-fade-in bg-navy-950/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

      {/* confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="confetti absolute top-[-5%] h-3 w-1.5 rounded-sm"
            style={{
              left: `${(i * 37) % 100}%`,
              background: ['#f7901e', '#fdba6b', '#2b388d', '#6c80d6', '#ffffff'][i % 5],
              animationDelay: `${(i % 7) * 0.12}s`,
              animationDuration: `${2.2 + (i % 5) * 0.35}s`,
            }}
          />
        ))}
      </div>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
        aria-describedby="success-desc"
        className="relative w-full max-w-md animate-scale-in overflow-hidden rounded-[32px] bg-white text-center shadow-[0_40px_100px_-30px_rgba(0,0,0,.6)]"
      >
        <div className="relative isolate overflow-hidden bg-navy-950 px-8 pb-12 pt-10">
          <div className="hex-pattern absolute inset-0 -z-10" aria-hidden />
          <div className="absolute -top-20 left-1/2 -z-10 h-56 w-56 -translate-x-1/2 rounded-full bg-brand-500/40 blur-3xl" aria-hidden />
          <button ref={closeRef} type="button" onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-navy-200 hover:bg-white/10 hover:text-white" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <span className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-400/40" aria-hidden />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_10px_30px_-8px_rgba(16,185,129,.8)]">
              <svg viewBox="0 0 24 24" className="h-10 w-10" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="success-check" />
              </svg>
            </span>
          </span>
          <h2 id="success-title" className="mt-6 text-3xl font-semibold text-white">Application submitted!</h2>
          <p className="mt-2 text-navy-200">{firstName ? `Thank you, ${firstName}.` : 'Thank you.'} We&apos;ve received it safely.</p>
        </div>

        <div className="-mt-6 px-8 pb-8">
          <div className="relative rounded-2xl bg-white p-5 text-left shadow-lift ring-1 ring-navy-100">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[.16em] text-navy-400">Applied for</dt>
                <dd className="mt-1 font-semibold text-navy-950">{result.application.position || result.application.role}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-[.16em] text-navy-400">Reference</dt>
                <dd className="mt-1 flex items-center gap-2 font-mono font-semibold text-navy-950">
                  {ref}
                  <button type="button" onClick={copyRef} className="rounded-md p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-800" aria-label="Copy reference">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </dd>
              </div>
            </dl>
          </div>
          <p id="success-desc" className="mt-5 text-sm leading-relaxed text-navy-500">
            Our hospitality recruitment team will review your application and contact you by email or phone.
          </p>
          <ul className="mt-4 space-y-1.5 text-left text-sm text-navy-600">
            {['CV received and stored securely', 'Reviewed by our hospitality specialists', 'We’ll be in touch about next steps'].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />{t}</li>
            ))}
          </ul>
          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            <Button variant="outline" icon={RotateCcw} onClick={onApplyAgain}>Apply for another</Button>
            <Button variant="brand" onClick={onClose}>Done</Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
