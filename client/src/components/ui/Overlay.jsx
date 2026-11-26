import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import Button from './Button';
import { cx } from '../../lib/format';

function useOverlay(open, onClose) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current?.();
      if (e.key === 'Tab' && ref.current) {
        // Simple focus trap
        const f = ref.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const list = [...f].filter((el) => !el.disabled);
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector('[data-autofocus], input, select, textarea, button')?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open]);
  return ref;
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  const ref = useOverlay(open, onClose);
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-navy-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cx('relative flex max-h-[92vh] w-full animate-scale-in flex-col rounded-t-3xl bg-white shadow-lift sm:rounded-3xl', widths[size])}
      >
        <div className="flex items-start justify-between gap-4 border-b border-navy-100 px-6 py-5">
          <div>
            <h2 id="modal-title" className="font-sans text-lg font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-navy-400">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-800" aria-label="Close dialog">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-navy-100 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

export function Drawer({ open, onClose, title, subtitle, children, footer }) {
  const ref = useOverlay(open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 animate-fade-in bg-navy-950/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <aside ref={ref} role="dialog" aria-modal="true" aria-label={title} className="absolute inset-y-0 right-0 flex w-full max-w-xl animate-slide-in flex-col bg-white shadow-lift">
        <div className="flex items-start justify-between gap-4 border-b border-navy-100 px-6 py-5">
          <div className="min-w-0">
            <h2 className="truncate font-sans text-lg font-semibold">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm text-navy-400">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-800" aria-label="Close panel">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="border-t border-navy-100 px-6 py-4">{footer}</div>}
      </aside>
    </div>,
    document.body
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', tone = 'danger', loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="flex gap-4">
        {tone === 'danger' && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral-500/10 text-coral-500">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
        )}
        <p className="text-sm leading-relaxed text-navy-600">{message}</p>
      </div>
    </Modal>
  );
}
