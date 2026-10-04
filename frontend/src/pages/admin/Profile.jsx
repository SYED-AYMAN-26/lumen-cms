import { useState } from 'react';
import api, { errorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { PageHeader } from '../../components/ui';

export default function Profile() {
  const { user, setUser } = useAuth();
  const { toast } = useUI();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', bio: user?.bio || '', avatar: user?.avatar || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  const save = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/profile', form);
      setUser(data.data);
      toast(data.message);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const change = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/password', passwords);
      if (data.data?.token) {
        if (localStorage.getItem('lumen_token')) localStorage.setItem('lumen_token', data.data.token);
        if (sessionStorage.getItem('lumen_token')) sessionStorage.setItem('lumen_token', data.data.token);
      }
      toast(data.message);
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form className="card space-y-3 p-5" onSubmit={save}>
        <PageHeader title="Profile" description={`${user?.role?.name || 'Account'} · ${user?.email}`} />
        <label className="block"><span className="label">Name</span><input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="block"><span className="label">Email</span><input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="block"><span className="label">Bio</span><textarea className="input" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></label>
        <label className="block"><span className="label">Avatar URL</span><input className="input" value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} /></label>
        <button className="btn-primary">Save profile</button>
      </form>
      <form className="card space-y-3 p-5" onSubmit={change}>
        <h2 className="font-serif text-3xl">Password</h2>
        <p className="text-sm text-stone-600">Changing your password signs out other sessions.</p>
        <label className="block"><span className="label">Current password</span><input className="input" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} /></label>
        <label className="block"><span className="label">New password</span><input className="input" type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} /></label>
        <button className="btn-primary">Update password</button>
      </form>
    </div>
  );
}
