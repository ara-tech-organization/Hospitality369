import {
  Children, Fragment, forwardRef, isValidElement, useCallback, useEffect, useId, useMemo, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, AlertCircle, Check, Search } from 'lucide-react';
import { cx } from '../../lib/format';

export function Field({ label, error, hint, required, children, className, htmlFor }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label} {required && <span className="text-coral-500" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-coral-600" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] text-navy-400">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef(function Input({ label, error, hint, required, className, inputClassName, icon: Icon, size, ...props }, ref) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={props.id || id}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" aria-hidden />}
        <input
          ref={ref}
          id={props.id || id}
          aria-invalid={error ? 'true' : undefined}
          aria-required={required || undefined}
          className={cx('input', size === 'sm' && 'input-sm', Icon && 'pl-10', error && 'input-error', inputClassName)}
          {...props}
        />
      </div>
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea({ label, error, hint, required, className, rows = 4, ...props }, ref) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={props.id || id}>
      <textarea ref={ref} id={props.id || id} rows={rows} aria-invalid={error ? 'true' : undefined} className={cx('input resize-y', error && 'input-error')} {...props} />
    </Field>
  );
});

/* ------------------------------------------------------------------------- */
/* Custom Select                                                              */
/* Drop-in replacement for <select>: same props (value, onChange(e), children  */
/* <option>/<optgroup>, placeholder, label, error, size…), rendered as an      */
/* accessible listbox in a portal so it is never clipped by modals/drawers.    */
/* ------------------------------------------------------------------------- */

/** Flatten <option>/<optgroup> children into [{ value, label, group, disabled }] */
function parseOptions(children, group = null, out = []) {
  Children.toArray(children).forEach((child) => {
    if (!isValidElement(child)) return;
    if (child.type === 'optgroup') {
      parseOptions(child.props.children, child.props.label, out);
    } else if (child.type === 'option') {
      const text = Children.toArray(child.props.children).join('');
      out.push({ value: String(child.props.value ?? text), label: text, group, disabled: Boolean(child.props.disabled) });
    } else if (child.type === Fragment) {
      parseOptions(child.props.children, group, out);
    }
  });
  return out;
}

export const Select = forwardRef(function Select(
  { label, error, hint, required, className, children, placeholder, size, selectClassName, value, onChange, onBlur, disabled, id: idProp, name, searchable, ...rest },
  ref
) {
  const autoId = useId();
  const id = idProp || autoId;
  const listId = `${id}-listbox`;
  const options = useMemo(() => {
    const parsed = parseOptions(children);
    // Optional selects (filters) offer the placeholder as a "clear" choice; required ones only show it as prompt text
    return placeholder !== undefined && !required ? [{ value: '', label: placeholder, group: null, placeholder: true }, ...parsed] : parsed;
  }, [children, placeholder, required]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);
  const showSearch = searchable ?? options.length > 8;

  const current = options.find((o) => o.value === String(value ?? ''));
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => !o.placeholder && `${o.label} ${o.group || ''}`.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const setRefs = (node) => {
    btnRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom;
    const up = below < 300 && r.top > below;
    setPos({ left: r.left, width: Math.max(r.width, 220), top: up ? undefined : r.bottom + 6, bottom: up ? window.innerHeight - r.top + 6 : undefined, up });
  }, []);

  const openList = () => {
    if (disabled) return;
    place();
    setQuery('');
    const idx = Math.max(0, options.findIndex((o) => o.value === String(value ?? '')));
    setActive(idx);
    setOpen(true);
  };

  // Blur is reported after React applies any new value, so form validation sees the fresh state
  const blurRef = useRef(onBlur);
  blurRef.current = onBlur;
  const close = useCallback((refocus = true) => {
    setOpen(false);
    if (refocus) btnRef.current?.focus();
    setTimeout(() => blurRef.current?.({ target: { name } }), 0);
  }, [name]);

  const choose = (opt) => {
    if (!opt || opt.disabled) return;
    if (opt.value !== String(value ?? '')) onChange?.({ target: { name, value: opt.value }, currentTarget: { name, value: opt.value } });
    close();
  };

  // reposition / outside click while open
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (btnRef.current?.contains(e.target) || listRef.current?.contains(e.target)) return;
      close(false);
    };
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    document.addEventListener('mousedown', onDoc);
    setTimeout(() => (showSearch ? searchRef.current : listRef.current)?.focus(), 0);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      document.removeEventListener('mousedown', onDoc);
    };
  }, [open, place, close, showSearch]);

  // keep active option in view
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const move = (delta) => {
    if (!filtered.length) return;
    let i = active;
    for (let n = 0; n < filtered.length; n += 1) {
      i = (i + delta + filtered.length) % filtered.length;
      if (!filtered[i].disabled) break;
    }
    setActive(i);
  };

  const onKey = (e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(filtered.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(filtered[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') { close(false); }
  };

  let lastGroup = null;

  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
      <div className="relative">
        <button
          ref={setRefs}
          id={id}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={error ? 'true' : undefined}
          aria-required={required || undefined}
          disabled={disabled}
          onClick={() => (open ? close() : openList())}
          onKeyDown={onKey}
          className={cx(
            'input flex items-center justify-between gap-3 pr-3 text-left',
            size === 'sm' && 'input-sm',
            error && 'input-error',
            open && 'border-brand-400 ring-4 ring-brand-100',
            selectClassName
          )}
          {...rest}
        >
          <span className={cx('truncate', (!current || current.placeholder) && 'text-navy-300')}>
            {current ? current.label : placeholder ?? 'Select…'}
          </span>
          <span className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all duration-300', open ? 'rotate-180 bg-brand-500 text-white' : 'bg-navy-50 text-navy-500')} aria-hidden>
            <ChevronDown className="h-3.5 w-3.5" />
          </span>
        </button>
      </div>

      {open && pos && createPortal(
        <div
          className={cx('fixed z-[120] overflow-hidden rounded-2xl border border-navy-100 bg-white/95 shadow-[0_24px_60px_-20px_rgba(11,16,48,.35)] backdrop-blur-xl', pos.up ? 'origin-bottom' : 'origin-top', 'animate-scale-in')}
          style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
          onKeyDown={onKey}
        >
          {showSearch && (
            <div className="border-b border-navy-100 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300" aria-hidden />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                  placeholder="Search…"
                  aria-label="Search options"
                  aria-controls={listId}
                  aria-activedescendant={filtered[active] ? `${id}-opt-${active}` : undefined}
                  className="w-full rounded-xl bg-navy-50/70 py-2 pl-9 pr-3 text-sm text-navy-900 placeholder:text-navy-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
            </div>
          )}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={id}
            aria-activedescendant={filtered[active] ? `${id}-opt-${active}` : undefined}
            className="max-h-72 overflow-y-auto overscroll-contain p-1.5 focus:outline-none"
          >
            {filtered.length === 0 && <li className="px-3 py-6 text-center text-sm text-navy-400">No matches</li>}
            {filtered.map((o, i) => {
              const header = o.group && o.group !== lastGroup ? o.group : null;
              lastGroup = o.group;
              const selected = o.value === String(value ?? '');
              return (
                <Fragment key={`${o.group || ''}-${o.value}-${i}`}>
                  {header && <li role="presentation" className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[.16em] text-brand-600">{header}</li>}
                  <li
                    id={`${id}-opt-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={o.disabled || undefined}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(o)}
                    className={cx(
                      'group/opt relative flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                      o.disabled && 'cursor-not-allowed opacity-40',
                      i === active ? 'bg-brand-50 text-navy-950' : 'text-navy-700',
                      selected && 'font-semibold',
                      o.placeholder && 'text-navy-400'
                    )}
                  >
                    <span className={cx('truncate transition-transform duration-200', i === active && 'translate-x-1')}>{o.label}</span>
                    {selected && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white">
                        <Check className="h-3 w-3" aria-hidden />
                      </span>
                    )}
                    {i === active && !selected && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-brand-500" aria-hidden />}
                  </li>
                </Fragment>
              );
            })}
          </ul>
        </div>,
        document.body
      )}
    </Field>
  );
});

export function Toggle({ checked, onChange, label, description, disabled, id }) {
  const autoId = useId();
  const tid = id || autoId;
  return (
    <div className="flex items-start justify-between gap-4">
      {(label || description) && (
        <label htmlFor={tid} className="cursor-pointer">
          {label && <span className="block text-sm font-semibold text-navy-800">{label}</span>}
          {description && <span className="mt-0.5 block text-[13px] text-navy-400">{description}</span>}
        </label>
      )}
      <button
        id={tid}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50',
          checked ? 'bg-gradient-to-r from-brand-400 to-brand-500' : 'bg-navy-200'
        )}
      >
        <span className={cx('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

export function Checkbox({ label, checked, onChange, error, id, children }) {
  const autoId = useId();
  const cid = id || autoId;
  return (
    <div>
      <label htmlFor={cid} className="flex cursor-pointer items-start gap-3 text-sm text-navy-600">
        <input
          id={cid}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? 'true' : undefined}
          className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded border-navy-300 accent-brand-500"
        />
        <span>{label || children}</span>
      </label>
      {error && <p className="mt-1.5 pl-7 text-[13px] font-medium text-coral-600" role="alert">{error}</p>}
    </div>
  );
}
