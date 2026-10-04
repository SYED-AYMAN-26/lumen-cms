import { useEffect, useState } from 'react';
import api, { errorMessage } from '../services/api';
import { Modal, Spinner } from './ui';
import { formatBytes } from '../utils/format';

export default function MediaPicker({ open, onClose, onSelect, kind = 'image', title = 'Choose media' }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = async (q = search) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/media', { params: { search: q, kind: kind === 'all' ? undefined : kind, limit: 24 } });
      setItems(data.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the library.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load('');
  }, [open, kind]);

  if (!open) return null;

  const upload = async (fileList) => {
    if (!fileList?.length) return;
    const form = new FormData();
    [...fileList].forEach((file) => form.append('files', file));
    setUploading(true);
    setError('');
    try {
      const { data } = await api.post('/media/upload', form);
      setItems((prev) => [...data.data, ...prev]);
    } catch (err) {
      setError(errorMessage(err, 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input className="input" placeholder="Search files" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(search)} />
        <button className="btn-secondary" onClick={() => load(search)}>Search</button>
        <label className="btn-primary cursor-pointer">
          {uploading ? <Spinner /> : 'Upload'}
          <input type="file" className="hidden" accept={kind === 'video' ? 'video/mp4,video/webm' : 'image/*'} multiple onChange={(e) => upload(e.target.files)} />
        </label>
      </div>
      {error && <p className="mb-3 text-sm text-rose-700">{error}</p>}
      {loading ? <div className="py-12 text-center text-stone-500"><Spinner className="h-5 w-5" /></div> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <button key={item._id} className="overflow-hidden rounded-xl border border-line text-left hover:border-copper" onClick={() => onSelect(item)}>
              <div className="aspect-[4/3] bg-stone-100">
                {item.kind === 'video' ? <div className="flex h-full items-center justify-center text-xs text-stone-500">Video · {formatBytes(item.size)}</div> : <img src={item.url} alt={item.altText || item.title || ''} className="h-full w-full object-cover" />}
              </div>
              <p className="truncate px-2 py-2 text-xs">{item.title || item.originalName}</p>
            </button>
          ))}
          {!items.length && <p className="col-span-full py-8 text-sm text-stone-500">No files match. Upload one to continue.</p>}
        </div>
      )}
    </Modal>
  );
}
