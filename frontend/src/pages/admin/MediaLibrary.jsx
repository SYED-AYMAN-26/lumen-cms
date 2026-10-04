import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { EmptyState, PageHeader, Pagination, Spinner } from '../../components/ui';
import { formatBytes, formatDateTime } from '../../utils/format';

export default function MediaLibrary() {
  const { can } = useAuth();
  const { toast, confirm } = useUI();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(null);
  const [drag, setDrag] = useState(false);
  const canUpload = can('upload_media', 'manage_media');
  const canDelete = can('delete_media', 'manage_media');
  const canEdit = can('upload_media', 'manage_media');

  const load = async (next = page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/media', { params: { page: next, search, kind: kind || undefined, limit: 18 } });
      setItems(data.data);
      setMeta(data.meta);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(page); }, [page]);

  const upload = async (fileList) => {
    if (!fileList?.length || !canUpload) return;
    const form = new FormData();
    [...fileList].forEach((file) => form.append('files', file));
    setUploading(true);
    setProgress(0);
    try {
      const { data } = await api.post('/media/upload', form, { onUploadProgress: (e) => setProgress(Math.round((e.loaded / (e.total || 1)) * 100)) });
      toast(data.message);
      setPage(1);
      load(1);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setUploading(false);
    }
  };

  const saveDetails = async () => {
    try {
      const { data } = await api.put(`/media/${active._id}`, { altText: active.altText, caption: active.caption, title: active.title, isPublic: active.isPublic });
      toast(data.message);
      setItems((list) => list.map((item) => item._id === data.data._id ? { ...item, ...data.data } : item));
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const remove = async (item) => {
    const ok = await confirm({ title: 'Delete this file?', message: 'Content that referenced it will show a missing image.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/media/${item._id}`);
      toast('File deleted.');
      setActive(null);
      load(page);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Library" title="Media" description="Images and videos used by the journal. Drag files onto the library, or browse." />
      <div
        className={`card mb-4 border-dashed p-6 text-center ${drag ? 'border-copper bg-orange-50' : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (canUpload) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
      >
        <p className="text-sm text-stone-600">{canUpload ? 'Drop JPG, PNG, WebP, SVG, MP4, or WebM files here.' : 'You can browse the library. Uploading requires permission.'}</p>
        {canUpload && (
          <label className="btn-primary mt-3 cursor-pointer">
            {uploading ? `Uploading ${progress}%` : 'Upload files'}
            <input type="file" multiple className="hidden" accept=".jpg,.jpeg,.png,.webp,.svg,.mp4,.webm,image/*,video/mp4,video/webm" onChange={(e) => upload(e.target.files)} />
          </label>
        )}
      </div>
      <form className="mb-4 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); setPage(1); load(1); }}>
        <input className="input" placeholder="Search filename, title, or alt text" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input sm:w-40" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="File type">
          <option value="">All types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
        </select>
        <button className="btn-secondary">Filter</button>
      </form>
      {loading ? <div className="py-16 text-center"><Spinner /></div> : !items.length ? <EmptyState title="The library is empty" body="Upload a still or a short film to begin." /> : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <button key={item._id} className="card overflow-hidden text-left" onClick={() => setActive(item)}>
              <div className="aspect-[4/3] bg-stone-100">
                {item.kind === 'video' ? <video src={item.url} className="h-full w-full object-cover" /> : <img src={item.url} alt={item.altText || ''} className="h-full w-full object-cover" />}
              </div>
              <div className="p-3">
                <p className="truncate text-sm">{item.title || item.originalName}</p>
                <p className="text-xs text-stone-500">{item.kind} · {formatBytes(item.size)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      <Pagination page={meta.page} pages={meta.pages} onPage={setPage} />
      {active && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onMouseDown={() => setActive(null)}>
          <aside className="h-full w-full max-w-md overflow-auto bg-white p-5" onMouseDown={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-2xl">File details</h2>
              <button onClick={() => setActive(null)} aria-label="Close">✕</button>
            </div>
            {active.kind === 'video' ? <video src={active.url} controls className="w-full rounded-xl" /> : <img src={active.url} alt={active.altText || ''} className="w-full rounded-xl" />}
            <dl className="mt-4 space-y-1 text-sm text-stone-600">
              <div className="flex justify-between gap-3"><dt>Filename</dt><dd className="truncate">{active.originalName}</dd></div>
              <div className="flex justify-between gap-3"><dt>Type</dt><dd>{active.mimeType}</dd></div>
              <div className="flex justify-between gap-3"><dt>Size</dt><dd>{formatBytes(active.size)}</dd></div>
              <div className="flex justify-between gap-3"><dt>Dimensions</dt><dd>{active.width ? `${active.width} × ${active.height}` : '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt>Uploaded by</dt><dd>{active.uploadedBy?.name || '—'}</dd></div>
              <div className="flex justify-between gap-3"><dt>Date</dt><dd>{formatDateTime(active.createdAt)}</dd></div>
            </dl>
            <p className="mt-3 break-all text-xs text-stone-500">{active.url}</p>
            <button className="btn-secondary mt-2" onClick={() => { navigator.clipboard.writeText(active.url); toast('URL copied.'); }}>Copy URL</button>
            <div className="mt-4 space-y-2">
              <label className="block"><span className="label">Title</span><input className="input" disabled={!canEdit} value={active.title || ''} onChange={(e) => setActive({ ...active, title: e.target.value })} /></label>
              <label className="block"><span className="label">Alt text</span><input className="input" disabled={!canEdit} value={active.altText || ''} onChange={(e) => setActive({ ...active, altText: e.target.value })} /></label>
              <label className="block"><span className="label">Caption</span><textarea className="input" disabled={!canEdit} value={active.caption || ''} onChange={(e) => setActive({ ...active, caption: e.target.value })} /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" disabled={!canEdit} checked={Boolean(active.isPublic)} onChange={(e) => setActive({ ...active, isPublic: e.target.checked })} /> Show in the public gallery</label>
            </div>
            <div className="mt-4 flex gap-2">
              {canEdit && <button className="btn-primary" onClick={saveDetails}>Save details</button>}
              {canDelete && <button className="btn-danger" onClick={() => remove(active)}>Delete</button>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
