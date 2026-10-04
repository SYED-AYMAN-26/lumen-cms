import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, PanelsTopLeft, Pencil, Eye, CalendarClock, CheckCircle2,
  Trash2, Image, FolderTree, Tags, Users, Shield, ScrollText, Mail, Settings, Menu, Search, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar, Logo } from '../components/ui';
import api from '../services/api';

const NAV = [
  { label: 'Overview', items: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true, perm: ['view_dashboard'] },
  ]},
  { label: 'Content', items: [
    { to: '/admin/content', label: 'All content', icon: FileText, perm: ['view_content', 'create_content'] },
    { to: '/admin/pages', label: 'Pages', icon: PanelsTopLeft, perm: ['view_content', 'manage_pages'] },
    { to: '/admin/drafts', label: 'Drafts', icon: Pencil, perm: ['view_content', 'create_content'] },
    { to: '/admin/review', label: 'In review', icon: Eye, perm: ['view_content', 'review_content'] },
    { to: '/admin/scheduled', label: 'Scheduled', icon: CalendarClock, perm: ['view_content', 'publish_content'] },
    { to: '/admin/published', label: 'Published', icon: CheckCircle2, perm: ['view_content'] },
    { to: '/admin/trash', label: 'Trash', icon: Trash2, perm: ['delete_content', 'manage_posts', 'manage_pages'] },
  ]},
  { label: 'Library', items: [
    { to: '/admin/media', label: 'Media library', icon: Image, perm: ['view_content', 'upload_media', 'manage_media'] },
    { to: '/admin/categories', label: 'Categories', icon: FolderTree, perm: ['view_content', 'manage_categories'] },
    { to: '/admin/tags', label: 'Tags', icon: Tags, perm: ['view_content', 'manage_tags'] },
  ]},
  { label: 'People', items: [
    { to: '/admin/users', label: 'Users', icon: Users, perm: ['manage_users'] },
    { to: '/admin/roles', label: 'Roles', icon: Shield, perm: ['manage_roles'] },
    { to: '/admin/permissions', label: 'Permissions', icon: Shield, perm: ['manage_roles'] },
  ]},
  { label: 'System', items: [
    { to: '/admin/activity', label: 'Activity logs', icon: ScrollText, perm: ['view_activity_logs'] },
    { to: '/admin/messages', label: 'Messages', icon: Mail, perm: ['manage_settings'] },
    { to: '/admin/settings', label: 'Settings', icon: Settings, perm: ['manage_settings'] },
  ]},
];

function allowed(can, item) {
  return !item.perm || can(...item.perm);
}

export default function AdminLayout() {
  const { user, can, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        document.getElementById('desk-search')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/search', { params: { q: query.trim() } });
        setResults(data.data);
      } catch {
        setResults(null);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  const go = async (path) => {
    setQuery('');
    setResults(null);
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      {open && <button className="fixed inset-0 z-30 bg-ink/40 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-[#141210] text-stone-200 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-5 py-5 text-[#f6f1e8]">
          <Logo className="h-7 w-7 text-[#fdba74]" />
          <div>
            <p className="font-serif text-xl leading-none">Lumen</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-stone-500">Desk</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)} aria-label="Close sidebar"><X size={18} /></button>
        </div>
        <nav className="nav-scroll flex-1 overflow-y-auto px-3 pb-4">
          {NAV.map((group) => {
            const items = group.items.filter((item) => allowed(can, item));
            if (!items.length) return null;
            return (
              <div key={group.label} className="mb-4">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">{group.label}</p>
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => `mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-white/10 text-white' : 'text-stone-400 hover:bg-white/5 hover:text-stone-100'}`}
                  >
                    <item.icon size={16} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/5" onClick={() => navigate('/admin/profile')}>
            <Avatar name={user?.name} src={user?.avatar} size={32} />
            <span className="min-w-0">
              <span className="block truncate text-sm text-white">{user?.name}</span>
              <span className="block truncate text-xs text-stone-500">{user?.role?.name}</span>
            </span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur md:px-6">
          <button className="btn-ghost px-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
          <div className="relative max-w-xl flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input id="desk-search" className="input pl-9" placeholder="Search the desk  ·  Ctrl K" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search the CMS" />
            {results && (
              <div className="card absolute left-0 right-0 top-12 z-30 max-h-96 overflow-auto p-2">
                {[
                  ['Content', results.content, (item) => `/admin/content/${item._id}`],
                  ['Pages', results.pages, (item) => `/admin/pages/${item._id}`],
                  ['Categories', results.categories, () => '/admin/categories'],
                  ['Media', results.media, () => '/admin/media'],
                  ['Users', results.users, (item) => `/admin/users?user=${item._id}`],
                ].map(([label, list, href]) => list?.length ? (
                  <div key={label} className="mb-2">
                    <p className="px-2 py-1 text-[10px] uppercase tracking-wider text-stone-400">{label}</p>
                    {list.map((item) => (
                      <button key={item._id} className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-stone-50" onClick={() => go(href(item))}>
                        {item.title || item.name || item.originalName || item.email}
                      </button>
                    ))}
                  </div>
                ) : null)}
                {!results.content?.length && !results.pages?.length && !results.users?.length && !results.media?.length && !results.categories?.length && (
                  <p className="px-2 py-3 text-sm text-stone-500">Nothing matched.</p>
                )}
              </div>
            )}
          </div>
          <a href="/" className="hidden text-sm text-stone-500 hover:text-ink sm:inline">View site</a>
          <div className="relative">
            <button className="flex items-center gap-2" onClick={() => setMenu((v) => !v)} aria-label="Account menu">
              <Avatar name={user?.name} src={user?.avatar} />
            </button>
            {menu && (
              <div className="card absolute right-0 mt-2 w-48 p-1">
                <button className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-50" onClick={() => { setMenu(false); navigate('/admin/profile'); }}>Profile</button>
                <button className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-50" onClick={() => { setMenu(false); logout().then(() => navigate('/login')); }}>Sign out</button>
              </div>
            )}
          </div>
        </header>
        <main className="px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
