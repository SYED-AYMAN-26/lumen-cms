import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import MediaPicker from '../../components/MediaPicker';
import { EmptyState, PageHeader, Spinner } from '../../components/ui';

export function Categories() {
  const { can } = useAuth();
  const { toast, confirm } = useUI();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null);
  const [picker, setPicker] = useState(false);
  const manage = can('manage_categories');

  const load = async (q = search) => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories', { params: { search: q } });
      setItems(data.data);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(''); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: form.name, slug: form.slug, description: form.description, image: form.image?._id || null };
      const res = form._id ? await api.put(`/categories/${form._id}`, payload) : await api.post('/categories', payload);
      toast(res.data.message);
      setForm(null);
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const remove = async (item) => {
    const ok = await confirm({ title: `Delete ${item.name}?`, message: 'Content in this category will become uncategorized.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/categories/${item._id}`);
      toast('Category deleted.');
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Taxonomy" title="Categories" description="One category per piece. The public journal uses these as sections." actions={manage && <button className="btn-primary" onClick={() => setForm({ name: '', slug: '', description: '', image: null })}>New category</button>} />
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); load(search); }}>
        <input className="input" placeholder="Search categories" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-secondary">Search</button>
      </form>
      {loading ? <Spinner /> : !items.length ? <EmptyState title="No categories" /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <article key={item._id} className="card flex gap-3 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">{item.image?.url && <img src={item.image.url} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <h2 className="font-medium">{item.name}</h2>
                <p className="text-xs text-stone-500">/{item.slug} · {item.contentCount} pieces</p>
                <p className="mt-1 text-sm text-stone-600">{item.description}</p>
                {manage && <div className="mt-2 flex gap-2 text-xs"><button className="text-copper" onClick={() => setForm(item)}>Edit</button><button className="text-rose-700" onClick={() => remove(item)}>Delete</button></div>}
              </div>
            </article>
          ))}
        </div>
      )}
      {form && (
        <form className="card mt-4 space-y-3 p-4" onSubmit={save}>
          <h2 className="font-serif text-2xl">{form._id ? 'Edit category' : 'New category'}</h2>
          <input className="input" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Slug" value={form.slug || ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <textarea className="input" placeholder="Description" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button type="button" className="btn-secondary" onClick={() => setPicker(true)}>{form.image ? 'Change image' : 'Category image'}</button>
          {form.image?.url && <img src={form.image.url} alt="" className="h-24 rounded-lg object-cover" />}
          <div className="flex gap-2"><button className="btn-primary">Save</button><button type="button" className="btn-secondary" onClick={() => setForm(null)}>Cancel</button></div>
        </form>
      )}
      <MediaPicker open={picker} onClose={() => setPicker(false)} onSelect={(media) => { setForm({ ...form, image: media }); setPicker(false); }} />
    </div>
  );
}

export function TagsPage() {
  const { can } = useAuth();
  const { toast, confirm } = useUI();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const manage = can('manage_tags');

  const load = async (q = search) => {
    const { data } = await api.get('/tags', { params: { search: q } });
    setItems(data.data);
  };
  useEffect(() => { load('').catch((err) => toast(errorMessage(err), 'error')); }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/tags', { name });
      toast(data.message);
      setName('');
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Taxonomy" title="Tags" description="A piece can carry several tags. They are used in the desk and on the public story page." />
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); load(search); }}>
        <input className="input" placeholder="Search tags" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-secondary">Search</button>
      </form>
      {(manage || can('create_content')) && (
        <form className="mb-4 flex gap-2" onSubmit={create}>
          <input className="input" placeholder="New tag" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn-primary">Add</button>
        </form>
      )}
      {!items.length ? <EmptyState title="No tags yet" /> : (
        <div className="card divide-y divide-line">
          {items.map((tag) => (
            <div key={tag._id} className="flex items-center justify-between px-4 py-3 text-sm">
              {editing === tag._id ? (
                <form className="flex flex-1 gap-2" onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await api.put(`/tags/${tag._id}`, { name: e.target.tagName.value });
                    setEditing(null);
                    load();
                  } catch (err) { toast(errorMessage(err), 'error'); }
                }}>
                  <input name="tagName" className="input" defaultValue={tag.name} />
                  <button className="btn-primary">Save</button>
                </form>
              ) : (
                <>
                  <div><span className="font-medium">{tag.name}</span><span className="ml-2 text-xs text-stone-500">/{tag.slug} · {tag.contentCount}</span></div>
                  {manage && <div className="flex gap-3 text-xs"><button className="text-copper" onClick={() => setEditing(tag._id)}>Edit</button><button className="text-rose-700" onClick={async () => {
                    const ok = await confirm({ title: `Delete “${tag.name}”?`, confirmLabel: 'Delete', danger: true });
                    if (!ok) return;
                    await api.delete(`/tags/${tag._id}`);
                    toast('Tag deleted.');
                    load();
                  }}>Delete</button></div>}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
