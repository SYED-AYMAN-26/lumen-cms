import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../services/api';
import { useUI } from '../../context/UIContext';
import { Badge, EmptyState, PageHeader, Pagination, Spinner } from '../../components/ui';
import { formatDateTime } from '../../utils/format';

export default function Messages() {
  const { toast, confirm } = useUI();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, unread: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (next = page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/messages', { params: { page: next, search, kind: kind || undefined } });
      setItems(data.data);
      setMeta(data.meta);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(page); }, [page]);

  return (
    <div>
      <PageHeader eyebrow="System" title="Messages" description={`${meta.unread || 0} unread notes from the public contact form and briefing list.`} />
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); setPage(1); load(1); }}>
        <input className="input" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input w-40" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">All</option>
          <option value="contact">Contact</option>
          <option value="subscribe">Briefing</option>
        </select>
        <button className="btn-secondary">Filter</button>
      </form>
      {loading ? <Spinner /> : !items.length ? <EmptyState title="No messages" /> : (
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item._id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-medium">{item.name}</h2>
                <span className="text-xs text-stone-500">{item.email}</span>
                <Badge status={item.read ? 'archived' : 'review'}>{item.read ? 'Read' : 'New'}</Badge>
                <span className="text-xs uppercase tracking-wide text-stone-400">{item.kind}</span>
                <span className="ml-auto text-xs text-stone-400">{formatDateTime(item.createdAt)}</span>
              </div>
              {item.subject && <p className="mt-1 text-sm">{item.subject}</p>}
              <p className="mt-2 text-sm leading-6 text-stone-600">{item.message}</p>
              <div className="mt-3 flex gap-2">
                <button className="btn-secondary" onClick={async () => { await api.patch(`/messages/${item._id}`, { read: !item.read }); load(page); }}>Mark {item.read ? 'unread' : 'read'}</button>
                <button className="btn-ghost text-rose-800" onClick={async () => {
                  const ok = await confirm({ title: 'Delete this message?', confirmLabel: 'Delete', danger: true });
                  if (!ok) return;
                  await api.delete(`/messages/${item._id}`);
                  toast('Deleted.');
                  load(page);
                }}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Pagination page={meta.page} pages={meta.pages} onPage={setPage} />
    </div>
  );
}
