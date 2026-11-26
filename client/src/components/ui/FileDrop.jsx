import { useRef, useState } from 'react';
import { UploadCloud, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cx, formatBytes } from '../../lib/format';

const EXT = ['.pdf', '.doc', '.docx'];

/**
 * Drag & drop resume picker with client-side validation.
 * `status`: idle | uploading | done | error ; `progress`: 0..100
 */
export default function FileDrop({ file, onChange, error, maxMb = 5, status = 'idle', progress = 0, disabled }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const [localError, setLocalError] = useState('');

  const pick = (f) => {
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!EXT.includes(ext)) {
      setLocalError('Only PDF, DOC or DOCX files are accepted');
      return;
    }
    if (f.size > maxMb * 1048576) {
      setLocalError(`File is too large – maximum size is ${maxMb} MB`);
      return;
    }
    if (f.size === 0) {
      setLocalError('This file is empty');
      return;
    }
    setLocalError('');
    onChange(f);
  };

  const shownError = localError || error;

  return (
    <div>
      <span className="label">
        CV / Resume <span className="text-coral-500" aria-hidden>*</span>
      </span>
      {!file ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files?.[0]);
          }}
          className={cx(
            'group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition',
            drag ? 'border-brand-400 bg-brand-50' : shownError ? 'border-coral-400/60 bg-coral-500/5' : 'border-navy-200 bg-navy-50/40 hover:border-brand-300 hover:bg-brand-50/50'
          )}
          aria-describedby="resume-help"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-soft ring-1 ring-navy-100 transition group-hover:scale-105">
            <UploadCloud className="h-6 w-6" aria-hidden />
          </div>
          <p className="text-sm font-semibold text-navy-800">
            <span className="text-brand-600 underline decoration-brand-300 underline-offset-4">Click to upload</span> or drag & drop
          </p>
          <p id="resume-help" className="mt-1 text-xs text-navy-400">PDF, DOC or DOCX · up to {maxMb} MB</p>
        </button>
      ) : (
        <div className={cx('relative overflow-hidden rounded-2xl border bg-white p-4', status === 'error' ? 'border-coral-400/60' : 'border-navy-200')}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 text-brand-300">
              <FileText className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy-900" title={file.name}>{file.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-navy-400">
                {formatBytes(file.size)} ·{' '}
                {status === 'uploading' && <span className="font-medium text-brand-600">Uploading {progress}%</span>}
                {status === 'done' && (
                  <span className="inline-flex items-center gap-1 font-medium text-sage-600">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Uploaded
                  </span>
                )}
                {status === 'error' && (
                  <span className="inline-flex items-center gap-1 font-medium text-coral-600">
                    <AlertCircle className="h-3.5 w-3.5" aria-hidden /> Upload failed
                  </span>
                )}
                {status === 'idle' && <span className="font-medium text-navy-500">Ready to upload</span>}
              </p>
            </div>
            {status !== 'uploading' && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-800"
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {(status === 'uploading' || status === 'done') && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-navy-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className={cx('h-full rounded-full transition-all duration-300', status === 'done' ? 'bg-sage-500' : 'bg-gradient-to-r from-brand-300 to-brand-500')} style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={(e) => pick(e.target.files?.[0])}
      />
      {shownError && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-coral-600" role="alert">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden /> {shownError}
        </p>
      )}
    </div>
  );
}
