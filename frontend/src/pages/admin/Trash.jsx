import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../services/api';
import { useUI } from '../../context/UIContext';
import { PageHeader, Spinner } from '../../components/ui';
import { formatDateTime } from '../../utils/format';

function Bin({ title, base }) {
  const { toast, confirm } = useUI();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get(base, { params: { trash: 1, limit: 50 } }).then((res) => setItems(res.data.data)).catch((err) => toast(errorMessage(err), 'error')).finally(() => setLoading(false));
  }, [base]);

  const restore = async (item) => {
    try {
      const { data } = await api.post(`${base}/${item._id}/restore`);
      toast(data.message);
      setItems(items.filter((x) => x._id !== item._id));
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };
  const destroy = async (item) => {
    const ok = await confirm({ title: `Delete “${item.title}” forever?`, message: 'This cannot be undone.', confirmLabel: 'Delete permanently', danger: true });
    if (!ok) return;
    try {
      await api.delete(`${base}/${item._id}/permanent`);
      toast('Permanently deleted.');
      setItems(items.filter((x) => x._id !== item._id));
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  if (loading) return <Spinner />;
  if (!items.length) return <p className="text-sm text-stone-500">Nothing in this bin.</p>;
  return (
    <ul className="card divide-y divide-line">
      {items.map((item) => (
        <li key={item._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
          <div>
            <p className="font-medium">{item.title}</p>
            <p className="text-xs text-stone-500">Removed {formatDateTime(item.deletedAt)}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => restore(item)}>Restore</button>
            <button className="btn-danger" onClick={() => destroy(item)}>Delete forever</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Trash() {
  const [tab, setTab] = useState('posts');
  return (
    <div>
      <PageHeader eyebrow="Content" title="Trash" description="Deleted pieces stay here until someone restores them or removes them permanently." />
      <div className="mb-4 flex gap-2">
        <button className={tab === 'posts' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('posts')}>Posts</button>
        <button className={tab === 'pages' ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab('pages')}>Pages</button>
      </div>
      {tab === 'posts' ? <Bin key="posts" title="Posts" base="/content" /> : <Bin key="pages" title="Pages" base="/pages" />}
    </div>
  );
}
