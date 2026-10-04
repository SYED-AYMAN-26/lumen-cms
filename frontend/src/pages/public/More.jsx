import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api, { errorMessage } from '../../services/api';
import { useSeo } from '../../hooks/useSeo';
import { Spinner } from '../../components/ui';

export function GalleryPage() {
  const site = useOutletContext();
  const [items, setItems] = useState(null);
  const [active, setActive] = useState(null);
  useSeo({ title: 'Gallery', description: 'Stills from published stories.', siteName: site?.settings?.siteName });
  useEffect(() => { api.get('/public/gallery').then((res) => setItems(res.data.data)); }, []);
  if (!items) return <div className="py-24 text-center"><Spinner /></div>;
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h1 className="font-serif text-5xl">Gallery</h1>
      <p className="mt-3 max-w-xl text-stone-600">Pictures attached to published work, plus anything an editor has marked public in the library.</p>
      <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {items.map((img) => (
          <button key={img.url} className="mb-4 block w-full break-inside-avoid text-left" onClick={() => setActive(img)}>
            <img src={img.url} alt={img.altText || ''} className="w-full" />
            <span className="mt-1 block text-xs text-stone-500">{img.altText || img.story}</span>
          </button>
        ))}
      </div>
      {!items.length && <p className="text-sm text-stone-500">No public images yet.</p>}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4" onClick={() => setActive(null)}>
          <figure className="max-w-4xl">
            <img src={active.url} alt={active.altText || ''} className="max-h-[80vh] w-full object-contain" />
            <figcaption className="mt-2 text-sm text-white">{active.altText} {active.slug && <Link className="underline" to={`/blog/${active.slug}`}>From {active.story}</Link>}</figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}

export function VideosPage() {
  const site = useOutletContext();
  const [items, setItems] = useState(null);
  useSeo({ title: 'Film', description: 'Video attached to published stories.', siteName: site?.settings?.siteName });
  useEffect(() => { api.get('/public/videos').then((res) => setItems(res.data.data)); }, []);
  if (!items) return <div className="py-24 text-center"><Spinner /></div>;
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
      <h1 className="font-serif text-5xl">Film</h1>
      <p className="mt-3 max-w-xl text-stone-600">Uploads and embeds from published pieces. Nothing here autoplays.</p>
      <div className="mt-8 space-y-10">
        {items.map((video, i) => (
          <article key={`${video.slug}-${i}`}>
            {video.embedUrl?.includes('youtube.com') || video.embedUrl?.includes('vimeo.com') ? (
              <iframe title={video.title || 'Video'} src={video.embedUrl} className="aspect-video w-full" allowFullScreen />
            ) : <video controls src={video.embedUrl} poster={video.thumbnail?.url} className="w-full" />}
            <h2 className="mt-3 font-serif text-2xl">{video.title || video.story}</h2>
            {video.description && <p className="mt-1 text-sm text-stone-600">{video.description}</p>}
            {video.captions && <p className="mt-1 text-xs text-stone-500">{video.captions}</p>}
            {video.slug && <Link to={`/blog/${video.slug}`} className="mt-2 inline-block text-sm text-copper">From the essay</Link>}
          </article>
        ))}
        {!items.length && <p className="text-sm text-stone-500">No published video yet.</p>}
      </div>
    </div>
  );
}

export function ContactPage() {
  const site = useOutletContext();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useSeo({ title: 'Contact', description: 'Write to the desk.', siteName: site?.settings?.siteName });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/public/contact', form);
      setNote(data.message);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-2 md:px-6">
      <div>
        <h1 className="font-serif text-5xl">Write to the desk</h1>
        <p className="mt-4 text-stone-600">Messages are stored for an administrator. This demo does not send email.</p>
        <p className="mt-6 text-sm">{site?.settings?.contactEmail || 'hello@lumen.cms'}</p>
      </div>
      <form className="space-y-3" onSubmit={submit}>
        <input className="input" placeholder="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <textarea className="input min-h-36" placeholder="Message" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        {error && <p className="text-sm text-rose-700">{error}</p>}
        {note && <p className="text-sm text-emerald-800">{note}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Sending…' : 'Send'}</button>
      </form>
    </div>
  );
}

export function NotFound() {
  useSeo({ title: 'Not found' });
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-[11px] uppercase tracking-[0.16em] text-copper">404</p>
      <h1 className="mt-3 font-serif text-5xl">This page is not in the journal.</h1>
      <p className="mt-3 text-stone-600">It may be a draft, or the address may simply be wrong.</p>
      <Link to="/" className="btn-primary mt-6">Return home</Link>
    </div>
  );
}
