import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../../services/api';
import { useUI } from '../../context/UIContext';
import { Avatar, Badge, EmptyState, PageHeader, Pagination, Spinner } from '../../components/ui';
import { formatDate, formatDateTime } from '../../utils/format';

const blank = { name: '', email: '', password: '', role: '', status: 'active', bio: '', avatar: '' };

export default function Users() {
  const { toast, confirm } = useUI();
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [resetFor, setResetFor] = useState(null);
  const [password, setPassword] = useState('');

  const load = async (next = page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', { params: { page: next, search, status: status || undefined, role: role || undefined } });
      setItems(data.data);
      setMeta(data.meta);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/roles').then((res) => setRoles(res.data.data)).catch(() => {});
  }, []);
  useEffect(() => { load(page); }, [page]);
  useEffect(() => {
    const id = params.get('user');
    if (!id) return;
    api.get(`/users/${id}`).then((res) => setForm(res.data.data)).catch(() => {});
  }, [params]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: form.name, email: form.email, role: form.role?._id || form.role, status: form.status, bio: form.bio, avatar: form.avatar };
      if (!form._id) payload.password = form.password;
      const res = form._id ? await api.put(`/users/${form._id}`, payload) : await api.post('/users', payload);
      toast(res.data.message);
      setForm(null);
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const deactivate = async (user) => {
    const ok = await confirm({ title: `Deactivate ${user.name}?`, message: 'They will not be able to sign in. You can reactivate them later.', confirmLabel: 'Deactivate', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/users/${user._id}`);
      toast('User deactivated.');
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const destroy = async (user) => {
    const ok = await confirm({ title: `Permanently delete ${user.name}?`, message: 'This cannot be undone. Super admin accounts cannot be deleted.', confirmLabel: 'Delete permanently', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/users/${user._id}/permanent`);
      toast('User deleted.');
      setForm(null);
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div>
      <PageHeader eyebrow="People" title="Users" description="Create accounts, change roles, and deactivate access. Passwords are hashed and never returned by the API." actions={<button className="btn-primary" onClick={() => setForm({ ...blank, role: roles.find((r) => r.slug === 'author')?._id || roles[0]?._id })}>Add user</button>} />
      <form className="mb-4 grid gap-2 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); setPage(1); load(1); }}>
        <input className="input md:col-span-2" placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <select className="input" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          <option value="">Any role</option>
          {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>
        <button className="btn-secondary">Filter</button>
      </form>
      {loading ? <div className="py-12 text-center"><Spinner /></div> : !items.length ? <EmptyState title="No users match" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase tracking-wider text-stone-500">
              <tr><th className="px-4 py-2">User</th><th>Role</th><th>Status</th><th>Created</th><th>Last login</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user._id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={user.name} src={user.avatar} size={28} /><div><div>{user.name}</div><div className="text-xs text-stone-500">{user.email}</div></div></div></td>
                  <td>{user.role?.name}</td>
                  <td><Badge status={user.status} /></td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatDateTime(user.lastLogin)}</td>
                  <td className="pr-3 text-right"><button className="text-xs text-copper" onClick={() => setForm({ ...user, role: user.role?._id })}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={meta.page} pages={meta.pages} onPage={setPage} />
      {form && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/40" onMouseDown={() => setForm(null)}>
          <form className="h-full w-full max-w-md space-y-3 overflow-auto bg-white p-5" onMouseDown={(e) => e.stopPropagation()} onSubmit={save}>
            <h2 className="font-serif text-3xl">{form._id ? form.name : 'New user'}</h2>
            <label className="block"><span className="label">Name</span><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="block"><span className="label">Email</span><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="block"><span className="label">Bio</span><textarea className="input" value={form.bio || ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
            <label className="block"><span className="label">Avatar URL</span><input className="input" value={form.avatar || ''} onChange={(e) => setForm({ ...form, avatar: e.target.value })} /></label>
            {!form._id && <label className="block"><span className="label">Password</span><input className="input" type="password" required value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>}
            <label className="block"><span className="label">Role</span>
              <select className="input" value={form.role?._id || form.role || ''} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </label>
            <label className="block"><span className="label">Status</span>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
            {form._id && <p className="text-xs text-stone-500">Created {formatDateTime(form.createdAt)} · Last login {formatDateTime(form.lastLogin)}</p>}
            <div className="flex flex-wrap gap-2 pt-2">
              <button className="btn-primary">Save</button>
              {form._id && <button type="button" className="btn-secondary" onClick={() => { setResetFor(form); setPassword(''); }}>Reset password</button>}
              {form._id && <button type="button" className="btn-secondary" onClick={() => deactivate(form)}>Deactivate</button>}
              {form._id && <button type="button" className="btn-danger" onClick={() => destroy(form)}>Delete</button>}
            </div>
          </form>
        </div>
      )}
      {resetFor && (
        <form className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4" onSubmit={async (e) => {
          e.preventDefault();
          try {
            const { data } = await api.post(`/users/${resetFor._id}/reset-password`, { password });
            toast(data.message);
            setResetFor(null);
          } catch (err) { toast(errorMessage(err), 'error'); }
        }}>
          <div className="card w-full max-w-sm space-y-3 p-5" onMouseDown={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl">Reset password</h2>
            <p className="text-sm text-stone-600">For {resetFor.name}. Their existing sessions will be signed out.</p>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
            <div className="flex gap-2"><button className="btn-primary">Reset</button><button type="button" className="btn-secondary" onClick={() => setResetFor(null)}>Cancel</button></div>
          </div>
        </form>
      )}
    </div>
  );
}
