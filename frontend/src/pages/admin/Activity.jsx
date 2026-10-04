import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../services/api';
import { EmptyState, PageHeader, Pagination, Spinner } from '../../components/ui';
import { formatDateTime } from '../../utils/format';

const ACTIONS = ['', 'auth.login', 'auth.logout', 'content.created', 'content.updated', 'content.published', 'content.deleted', 'user.created', 'user.updated', 'user.role_changed', 'media.uploaded', 'media.deleted', 'settings.updated', 'role.updated'];

export default function Activity() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (next = page) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/activity', { params: { page: next, search, action: action || undefined, from: from || undefined, to: to || undefined } });
      setItems(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(page); }, [page]);

  return (
    <div>
      <PageHeader eyebrow="System" title="Activity" description="Sign-ins, publishes, uploads, and settings changes. IP addresses are recorded from the request when the platform provides one." />
      <form className="mb-4 grid gap-2 md:grid-cols-5" onSubmit={(e) => { e.preventDefault(); setPage(1); load(1); }}>
        <input className="input md:col-span-2" placeholder="Search user, action, or title" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={action} onChange={(e) => setAction(e.target.value)} aria-label="Action">
          {ACTIONS.map((a) => <option key={a || 'all'} value={a}>{a || 'Any action'}</option>)}
        </select>
        <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
        <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" />
        <button className="btn-secondary">Filter</button>
      </form>
      {error && <p className="mb-3 text-sm text-rose-700">{error}</p>}
      {loading ? <Spinner /> : !items.length ? <EmptyState title="No activity matched" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase tracking-wider text-stone-500">
              <tr><th className="px-4 py-2">When</th><th>User</th><th>Action</th><th>Resource</th><th>IP</th></tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(item.createdAt)}</td>
                  <td>{item.user?.name || 'System'}</td>
                  <td>{item.action}</td>
                  <td className="text-stone-600">{item.resourceType}{item.metadata?.title ? ` · ${item.metadata.title}` : ''}</td>
                  <td className="text-xs text-stone-500">{item.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={meta.page} pages={meta.pages} onPage={setPage} />
    </div>
  );
}
