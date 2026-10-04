import { STATUS_LABEL, initials, statusClass } from '../utils/format';

export function Logo({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" />
      <path d="M16 3.5v3.2M16 25.3v3.2M3.5 16h3.2M25.3 16h3.2M7.2 7.2l2.2 2.2M22.6 22.6l2.2 2.2M24.8 7.2l-2.2 2.2M9.4 22.6l-2.2 2.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function Spinner({ className = 'h-4 w-4' }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} aria-hidden="true" />;
}

export function ScreenLoader({ label = 'Opening the desk…' }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper text-ink">
      <Logo className="h-10 w-10" />
      <p className="mt-4 text-sm text-stone-500">{label}</p>
    </div>
  );
}

export function Avatar({ name, src, size = 32 }) {
  if (src) {
    return <img src={src} alt="" className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-[#2a241f] font-medium text-[#fdba74]" style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {initials(name)}
    </span>
  );
}

export function Badge({ status, children }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusClass(status)}`}>{children || STATUS_LABEL[status] || status}</span>;
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && <span className="label">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-rose-700">{error}</span>}
    </label>
  );
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="card flex flex-col items-start px-6 py-12">
      <div className="mb-4 h-10 w-10 rounded-full border border-line" />
      <h3 className="font-serif text-2xl">{title}</h3>
      {body && <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Pagination({ page, pages, onPage }) {
  if (!pages || pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-2">
        <button className="btn-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <button className="btn-secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/45 p-3 sm:items-center" onMouseDown={onClose}>
      <div className={`card max-h-[90vh] w-full overflow-auto p-5 ${wide ? 'max-w-4xl' : 'max-w-lg'}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-serif text-2xl">{title}</h2>
          <button className="btn-ghost px-2" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-copper">{eyebrow}</p>}
        <h1 className="font-serif text-3xl tracking-tight text-ink md:text-4xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-stone-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Cover({ src, alt = '', className = '' }) {
  if (!src) return <div className={`bg-gradient-to-br from-stone-800 to-copper ${className}`} />;
  return <img src={src} alt={alt} className={`object-cover ${className}`} />;
}
