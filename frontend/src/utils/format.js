export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

export function timeAgo(value) {
  if (!value) return '—';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '—';
  const seconds = Math.round((Date.now() - then) / 1000);
  if (Math.abs(seconds) < 60) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 14) return `${days}d ago`;
  return formatDate(value);
}

export function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function readingTime(html = '') {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'L';
}

export function slugify(text = '') {
  return text.toLowerCase().trim().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

export function toDatetimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const STATUS_LABEL = {
  draft: 'Draft',
  review: 'In review',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
  trash: 'Trash',
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
};

export function statusClass(status) {
  const map = {
    draft: 'bg-stone-100 text-stone-700',
    review: 'bg-amber-100 text-amber-900',
    scheduled: 'bg-sky-100 text-sky-900',
    published: 'bg-emerald-100 text-emerald-900',
    archived: 'bg-slate-200 text-slate-700',
    trash: 'bg-rose-100 text-rose-900',
    active: 'bg-emerald-100 text-emerald-900',
    inactive: 'bg-stone-200 text-stone-700',
    suspended: 'bg-rose-100 text-rose-900',
  };
  return map[status] || 'bg-stone-100 text-stone-700';
}
