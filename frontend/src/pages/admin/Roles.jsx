import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../services/api';
import { useUI } from '../../context/UIContext';
import { PageHeader, Spinner } from '../../components/ui';

export function Roles() {
  const { toast, confirm } = useUI();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({ name: '', description: '', permissions: [] });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/permissions');
      setPermissions(data.data.permissions);
      setRoles(data.data.roles);
    } catch (err) {
      toast(errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const toggle = (role, key) => {
    if (role.slug === 'super-admin') return;
    const has = role.permissions.includes(key);
    const permissionsNext = has ? role.permissions.filter((p) => p !== key) : [...role.permissions, key];
    setRoles(roles.map((r) => r._id === role._id ? { ...r, permissions: permissionsNext } : r));
  };

  const save = async (role) => {
    try {
      const { data } = await api.put(`/roles/${role._id}`, { name: role.name, description: role.description, permissions: role.permissions });
      toast(data.message);
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const remove = async (role) => {
    const ok = await confirm({ title: `Delete ${role.name}?`, message: 'System roles cannot be deleted. Custom roles can, if nobody is assigned.', confirmLabel: 'Delete', danger: true });
    if (!ok) return;
    try {
      await api.delete(`/roles/${role._id}`);
      toast('Role deleted.');
      load();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const groups = [...new Set(permissions.map((p) => p.group))];

  return (
    <div>
      <PageHeader eyebrow="People" title="Roles & permissions" description="Changes here are enforced by the API. Hiding a button is not the security boundary." actions={<button className="btn-primary" onClick={() => setCreating(true)}>New role</button>} />
      {loading ? <Spinner /> : roles.map((role) => (
        <section key={role._id} className="card mb-4 p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl">{role.name}</h2>
              <p className="text-sm text-stone-500">{role.description}</p>
              {role.slug === 'super-admin' && <p className="mt-1 text-xs text-copper">Locked. This role always has every permission.</p>}
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => save(role)}>Save role</button>
              {!role.isSystem && <button className="btn-danger" onClick={() => remove(role)}>Delete</button>}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <div key={group}>
                <p className="label">{group}</p>
                {permissions.filter((p) => p.group === group).map((perm) => (
                  <label key={perm.key} className="mt-1 flex items-start gap-2 text-sm">
                    <input type="checkbox" className="mt-1" disabled={role.slug === 'super-admin'} checked={role.slug === 'super-admin' || role.permissions.includes(perm.key)} onChange={() => toggle(role, perm.key)} />
                    <span><span className="font-medium">{perm.key}</span><span className="block text-xs text-stone-500">{perm.description}</span></span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
      {creating && (
        <form className="card space-y-3 p-4" onSubmit={async (e) => {
          e.preventDefault();
          try {
            const { data } = await api.post('/roles', draft);
            toast(data.message);
            setCreating(false);
            setDraft({ name: '', description: '', permissions: [] });
            load();
          } catch (err) { toast(errorMessage(err), 'error'); }
        }}>
          <h2 className="font-serif text-2xl">Custom role</h2>
          <input className="input" placeholder="Name" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <textarea className="input" placeholder="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <button className="btn-primary">Create</button>
        </form>
      )}
    </div>
  );
}

export function Permissions() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api.get('/permissions').then((res) => setData(res.data.data)).catch((err) => setError(errorMessage(err)));
  }, []);
  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!data) return <Spinner />;
  return (
    <div>
      <PageHeader eyebrow="People" title="Permission catalog" description="Every permission the API understands. Assign them on the Roles page." />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="border-b border-line text-[11px] uppercase tracking-wider text-stone-500">
            <tr><th className="px-4 py-2">Permission</th><th>Group</th><th>Description</th><th>Roles</th></tr>
          </thead>
          <tbody>
            {data.permissions.map((perm) => (
              <tr key={perm.key} className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3 font-medium">{perm.key}</td>
                <td className="py-3">{perm.group}</td>
                <td className="py-3 text-stone-600">{perm.description}</td>
                <td className="py-3 text-xs text-stone-500">{data.roles.filter((r) => r.slug === 'super-admin' || r.permissions.includes(perm.key)).map((r) => r.name).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
