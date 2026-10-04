import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import api from '../services/api';
import { Logo } from '../components/ui';

const SiteContext = { current: null };
export function useSite() {
  return SiteContext.current || { settings: { siteName: 'Lumen', description: '', contactEmail: 'hello@lumen.cms' }, categories: [] };
}

export default function PublicLayout() {
  const [site, setSite] = useState(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  SiteContext.current = site;

  useEffect(() => {
    api.get('/public/bootstrap').then((res) => setSite(res.data.data)).catch(() => setSite({ settings: { siteName: 'Lumen', description: 'A journal of design, technology, and making.', contactEmail: 'hello@lumen.cms' }, categories: [] }));
  }, []);

  const settings = site?.settings || { siteName: 'Lumen', description: '', contactEmail: 'hello@lumen.cms' };
  const links = [
    ['/blog', 'Journal'],
    ['/gallery', 'Gallery'],
    ['/videos', 'Film'],
    ['/about', 'About'],
    ['/contact', 'Contact'],
  ];

  const search = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] text-ink">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-7 w-7" />
            <span className="font-serif text-2xl tracking-tight">{settings.siteName}</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-5 text-sm text-stone-600 md:flex">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'text-ink' : 'hover:text-ink'}>{label}</NavLink>
            ))}
          </nav>
          <form onSubmit={search} className="hidden md:block">
            <input className="input w-40 lg:w-52" placeholder="Search" aria-label="Search the journal" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <Link to="/login" className="hidden text-sm text-stone-500 hover:text-ink md:inline">Desk</Link>
          <button className="ml-auto md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <div className="space-y-3 border-t border-line px-4 py-4 md:hidden">
            {links.map(([to, label]) => <Link key={to} to={to} className="block" onClick={() => setOpen(false)}>{label}</Link>)}
            <form onSubmit={search}><input className="input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></form>
            <Link to="/login" onClick={() => setOpen(false)}>Open the desk</Link>
          </div>
        )}
      </header>
      <main id="content">
        <Outlet context={site} />
      </main>
      <footer className="mt-20 border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-6">
          <div>
            <p className="font-serif text-2xl">{settings.siteName}</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-stone-600">{settings.description}</p>
          </div>
          <div className="text-sm">
            <p className="label">Journal</p>
            <div className="mt-2 flex flex-col gap-1 text-stone-600">
              {(site?.categories || []).map((cat) => <Link key={cat.slug} to={`/category/${cat.slug}`}>{cat.name}</Link>)}
              <Link to="/p/faq">Questions</Link>
              <Link to="/p/studio">The studio</Link>
            </div>
          </div>
          <div className="text-sm text-stone-600">
            <p className="label">Correspondence</p>
            <p className="mt-2">{settings.contactEmail}</p>
            <p className="mt-4 text-xs text-stone-400">© {new Date().getFullYear()} {settings.siteName}. A local demonstration journal.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
