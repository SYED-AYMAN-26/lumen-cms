import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { Badge, EmptyState, PageHeader, Pagination, Spinner } from '../../components/ui';
import { formatDate } from '../../utils/format';

const TYPES = ['', 'post', 'article', 'news', 'announcement'];
const STATUSES = ['', 'draft', 'review', 'scheduled', 'published', 'archived'];

export default function ContentList({
  mode = 'content',
  lockedStatus = '',
  title = 'Content',
  description = 'Every piece the desk is holding. Filters and search talk to the API, not a static table.',
}) {
  const isPage = mode === 'page';
  const base = isPage ? '/pages' : '/content';
  const editBase = isPage ? '/admin/pages' : '/admin/content';
  const { can } = useAuth();
  const { toast, confirm } = useUI();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(lockedStatus);
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [author, setAuthor] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canCreate = isPage ? can('manage_pages') : can('create_content', 'manage_posts');
  const canPublish = isPage ? can('manage_pages', 'publish_content') : can('publish_content', 'manage_posts');
  const canDelete = isPage ? can('manage_pages', 'delete_content') : can('delete_content', 'manage_posts');

  const load = async (nextPage = page) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(base, {
        params: {
          page: nextPage,
          search,
          status: lockedStatus || status || undefined,
          trash: lockedStatus === 'trash' ? 1 : undefined,
          type: !isPage && type ? type : undefined,
          category: !isPage && category ? category : undefined,
          author: author || undefined,
          from: from || undefined,
          to: to || undefined,
        },
      });
      setItems(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isPage) api.get('/categories').then((res) => setCategories(res.data.data)).catch(() => {});
  }, [isPage]);

  useEffect(() => { load(page); }, [page, lockedStatus]);

  const act = async (id, action) => {
    try {
      const { data } = await api.post(`${base}/${id}/${action}`);
      toast(data.message || 'Updated.');
      load(page);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const remove = async (item) => {
    const ok = await confirm({ title: 'Move to trash?', message: `“${item.title}” can be restored later.`, confirmLabel: 'Move to trash', danger: true });
    if (!ok) return;
    try {
      await api.delete(`${base}/${item._id}`);
      toast('Moved to trash.');
      load(page);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow={isPage ? 'Pages' : 'Journal'}
        title={title}
        description={description}
        actions={canCreate && <Link className="btn-primary" to={`${editBase}/new`}>{isPage ? 'New page' : 'New post'}</Link>}
      />
      <form className="card mb-4 grid gap-2 p-3 md:grid-cols-6" onSubmit={(e) => { e.preventDefault(); setPage(1); load(1); }}>
        <input className="input md:col-span-2" placeholder="Search title or slug" value={search} onChange={(e) => setSearch(e.target.value)} />
        {!lockedStatus && (
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            {STATUSES.map((s) => <option key={s || 'all'} value={s}>{s ? s : 'Any status'}</option>)}
          </select>
        )}
        {!isPage && (
          <select className="input" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type">
            {TYPES.map((t) => <option key={t || 'all'} value={t}>{t || 'Any type'}</option>)}
          </select>
        )}
        {!isPage && (
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="">Any category</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
        <select className="input" value={author} onChange={(e) => setAuthor(e.target.value)} aria-label="Author">
          <option value="">Any author</option>
          <option value="me">Mine</option>
        </select>
        <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <input className="input" type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
        <button className="btn-secondary">Apply</button>
      </form>
      {error && <p className="mb-3 text-sm text-rose-700">{error}</p>}
      {loading ? <div className="py-16 text-center"><Spinner /></div> : items.length === 0 ? (
        <EmptyState title="Nothing in this list" body="Adjust the filters, or create something new." action={canCreate && <Link className="btn-primary" to={`${editBase}/new`}>Create</Link>} />
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-12 gap-2 border-b border-line px-4 py-2 text-[11px] uppercase tracking-wider text-stone-500 md:grid">
            <span className="col-span-5">Title</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-2">Author</span>
            <span className="col-span-1">Updated</span>
            <span className="col-span-2 text-right">Actions</span>
          </div>
          {items.map((item) => (
            <div key={item._id} className="grid gap-2 border-b border-line px-4 py-3 last:border-0 md:grid-cols-12 md:items-center">
              <div className="md:col-span-5">
                <button className="text-left font-medium hover:text-copper" onClick={() => navigate(`${editBase}/${item._id}`)}>{item.title}</button>
                <p className="text-xs text-stone-500">/{isPage ? (item.slug === 'about' ? 'about' : `p/${item.slug}`) : `blog/${item.slug}`}{item.type ? ` · ${item.type}` : ''}{item.category?.name ? ` · ${item.category.name}` : ''}</p>
              </div>
              <div className="md:col-span-2"><Badge status={item.deletedAt ? 'trash' : item.status} /></div>
              <div className="text-sm text-stone-600 md:col-span-2">{item.author?.name || '—'}</div>
              <div className="text-sm text-stone-500 md:col-span-1">{formatDate(item.updatedAt)}</div>
              <div className="flex flex-wrap justify-end gap-1 md:col-span-2">
                <button className="btn-ghost px-2 text-xs" onClick={() => navigate(`${editBase}/${item._id}`)}>Edit</button>
                {canPublish && item.status !== 'published' && !item.deletedAt && <button className="btn-ghost px-2 text-xs" onClick={() => act(item._id, 'publish')}>Publish</button>}
                {canPublish && item.status === 'published' && <button className="btn-ghost px-2 text-xs" onClick={() => act(item._id, 'unpublish')}>Unpublish</button>}
                {canCreate && <button className="btn-ghost px-2 text-xs" onClick={async () => {
                  try {
                    const { data } = await api.post(`${base}/${item._id}/duplicate`);
                    toast(data.message);
                    navigate(`${editBase}/${data.data._id}`);
                  } catch (err) { toast(errorMessage(err), 'error'); }
                }}>Copy</button>}
                {canDelete && !item.deletedAt && <button className="btn-ghost px-2 text-xs text-rose-800" onClick={() => remove(item)}>Trash</button>}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={meta.page} pages={meta.pages} onPage={setPage} />
    </div>
  );
}
