import { useEffect, useState } from 'react';
import api, { errorMessage } from '../../services/api';
import { useUI } from '../../context/UIContext';
import MediaPicker from '../../components/MediaPicker';
import { PageHeader, Spinner } from '../../components/ui';

const TABS = ['General', 'Content', 'Users', 'Media', 'Security'];

export default function Settings() {
  const { toast } = useUI();
  const [settings, setSettings] = useState(null);
  const [roles, setRoles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState('General');
  const [picker, setPicker] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/settings'), api.get('/roles'), api.get('/categories')])
      .then(([s, r, c]) => { setSettings(s.data.data); setRoles(r.data.data); setCategories(c.data.data); })
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!settings) return <Spinner />;

  const set = (group, key, value) => setSettings({ ...settings, [group]: { ...settings[group], [key]: value } });

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        general: { ...settings.general, logo: settings.general.logo?._id || settings.general.logo || null, favicon: settings.general.favicon?._id || null },
        content: { ...settings.content, defaultCategory: settings.content.defaultCategory?._id || settings.content.defaultCategory || null },
        users: { ...settings.users, defaultRole: settings.users.defaultRole?._id || settings.users.defaultRole || null },
        media: settings.media,
        security: settings.security,
      };
      const { data } = await api.put('/settings', payload);
      toast(data.message);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <form onSubmit={save}>
      <PageHeader eyebrow="System" title="Settings" description="Site name, publishing defaults, registration, upload limits, and password rules." actions={<button className="btn-primary">Save settings</button>} />
      <div className="mb-4 flex gap-2 overflow-auto">
        {TABS.map((name) => <button type="button" key={name} className={tab === name ? 'btn-primary' : 'btn-secondary'} onClick={() => setTab(name)}>{name}</button>)}
      </div>
      <div className="card space-y-4 p-5">
        {tab === 'General' && <>
          <label className="block"><span className="label">Website name</span><input className="input" value={settings.general.siteName || ''} onChange={(e) => set('general', 'siteName', e.target.value)} /></label>
          <label className="block"><span className="label">Description</span><textarea className="input" value={settings.general.description || ''} onChange={(e) => set('general', 'description', e.target.value)} /></label>
          <label className="block"><span className="label">Contact email</span><input className="input" value={settings.general.contactEmail || ''} onChange={(e) => set('general', 'contactEmail', e.target.value)} /></label>
          <label className="block"><span className="label">Timezone</span><input className="input" value={settings.general.timezone || ''} onChange={(e) => set('general', 'timezone', e.target.value)} /></label>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => setPicker('logo')}>Choose logo</button>
            <button type="button" className="btn-secondary" onClick={() => setPicker('favicon')}>Choose favicon</button>
          </div>
          {settings.general.logo?.url && <img src={settings.general.logo.url} alt="Logo" className="h-16 rounded" />}
        </>}
        {tab === 'Content' && <>
          <label className="block"><span className="label">Posts per page</span><input className="input" type="number" min="3" max="48" value={settings.content.postsPerPage || 9} onChange={(e) => set('content', 'postsPerPage', Number(e.target.value))} /></label>
          <label className="block"><span className="label">Default category</span>
            <select className="input" value={settings.content.defaultCategory?._id || settings.content.defaultCategory || ''} onChange={(e) => set('content', 'defaultCategory', e.target.value)}>
              <option value="">None</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <p className="text-sm text-stone-500">If a piece is published without a category, this one is applied. Scheduled items publish themselves when their time arrives.</p>
        </>}
        {tab === 'Users' && <>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(settings.users.registrationEnabled)} onChange={(e) => set('users', 'registrationEnabled', e.target.checked)} /> Allow public registration</label>
          <label className="block"><span className="label">Default role for new registrations</span>
            <select className="input" value={settings.users.defaultRole?._id || settings.users.defaultRole || ''} onChange={(e) => set('users', 'defaultRole', e.target.value)}>
              {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </label>
        </>}
        {tab === 'Media' && <>
          <label className="block"><span className="label">Maximum upload size (MB)</span><input className="input" type="number" min="1" max="80" value={settings.media.maxUploadMb || 25} onChange={(e) => set('media', 'maxUploadMb', Number(e.target.value))} /></label>
          <label className="block"><span className="label">Allowed image types</span><input className="input" value={(settings.media.allowedImageTypes || []).join(', ')} onChange={(e) => set('media', 'allowedImageTypes', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} /></label>
          <label className="block"><span className="label">Allowed video types</span><input className="input" value={(settings.media.allowedVideoTypes || []).join(', ')} onChange={(e) => set('media', 'allowedVideoTypes', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} /></label>
          <p className="text-sm text-stone-500">Files are stored locally under backend/uploads. Swap the storage service if you later move them to cloud object storage.</p>
        </>}
        {tab === 'Security' && <>
          <label className="block"><span className="label">Minimum password length</span><input className="input" type="number" min="8" max="64" value={settings.security.minPasswordLength || 8} onChange={(e) => set('security', 'minPasswordLength', Number(e.target.value))} /></label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.security.requireUppercase} onChange={(e) => set('security', 'requireUppercase', e.target.checked)} /> Require an uppercase letter</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.security.requireNumber} onChange={(e) => set('security', 'requireNumber', e.target.checked)} /> Require a number</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.security.requireSymbol} onChange={(e) => set('security', 'requireSymbol', e.target.checked)} /> Require a symbol</label>
          <label className="block"><span className="label">Session length (hours)</span><input className="input" type="number" min="1" value={settings.security.tokenExpiryHours || 12} onChange={(e) => set('security', 'tokenExpiryHours', Number(e.target.value))} /></label>
          <label className="block"><span className="label">Remember-me length (days)</span><input className="input" type="number" min="1" value={settings.security.rememberExpiryDays || 30} onChange={(e) => set('security', 'rememberExpiryDays', Number(e.target.value))} /></label>
        </>}
      </div>
      <MediaPicker open={Boolean(picker)} onClose={() => setPicker(null)} onSelect={(media) => { set('general', picker, media); setPicker(null); }} />
    </form>
  );
}
