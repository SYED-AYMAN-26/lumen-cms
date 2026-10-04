import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import { useSeo } from '../../hooks/useSeo';
import { Cover, Spinner } from '../../components/ui';
import { formatDate } from '../../utils/format';

export default function Home() {
  const site = useOutletContext();
  const [data, setData] = useState(null);
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  useSeo({ title: '', description: site?.settings?.description, siteName: site?.settings?.siteName || 'Lumen' });

  useEffect(() => {
    api.get('/public/home').then((res) => setData(res.data.data)).catch(() => setData({ featured: null, stories: [], latest: [], videos: [] }));
  }, []);

  if (!data) return <div className="py-24 text-center"><Spinner /></div>;
  const featured = data.featured;

  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-end gap-8 px-4 py-12 md:grid-cols-12 md:px-6 md:py-16">
        <div className="md:col-span-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">The journal</p>
          <h1 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight md:text-6xl">
            {featured ? featured.title : 'Stories on design, technology, and making.'}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-7 text-stone-600">{featured?.excerpt || site?.settings?.description}</p>
          {featured && (
            <p className="mt-4 text-sm text-stone-500">{featured.category?.name} · {formatDate(featured.publishedAt)} · {featured.author?.name}</p>
          )}
          {featured && <Link to={`/blog/${featured.slug}`} className="btn-primary mt-6">Read the essay</Link>}
        </div>
        <Link to={featured ? `/blog/${featured.slug}` : '/blog'} className="md:col-span-7">
          <Cover src={featured?.featuredImage?.url} alt={featured?.featuredImage?.altText || featured?.title || ''} className="aspect-[16/11] w-full rounded-sm" />
        </Link>
      </section>

      <section className="border-y border-line">
        <div className="mx-auto grid max-w-6xl md:grid-cols-3">
          {data.stories.map((story) => (
            <Link key={story.slug} to={`/blog/${story.slug}`} className="border-line px-5 py-6 hover:bg-white md:border-l">
              <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">{story.category?.name}</p>
              <h2 className="mt-2 font-serif text-2xl leading-tight">{story.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">{story.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_280px] md:px-6">
        <div>
          <h2 className="font-serif text-3xl">Latest</h2>
          <ul className="mt-4 divide-y divide-line">
            {data.latest.map((story) => (
              <li key={story.slug}>
                <Link to={`/blog/${story.slug}`} className="flex items-center justify-between gap-4 py-4">
                  <span>
                    <span className="block font-medium">{story.title}</span>
                    <span className="text-xs text-stone-500">{story.category?.name} · {formatDate(story.publishedAt)}</span>
                  </span>
                  <span className="hidden text-sm text-copper sm:inline">Read</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <aside>
          <h2 className="font-serif text-3xl">Sections</h2>
          <ul className="mt-4 space-y-3">
            {(site?.categories || []).map((cat) => (
              <li key={cat.slug}>
                <Link to={`/category/${cat.slug}`} className="flex items-baseline justify-between border-b border-line py-2">
                  <span>{cat.name}</span>
                  <span className="text-xs text-stone-500">{cat.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {!!data.videos?.length && (
        <section className="bg-[#141210] py-14 text-[#f6f1e8]">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#fdba74]">Film</p>
            <h2 className="mt-2 font-serif text-4xl">Moving pictures, still pages</h2>
            <Link to="/videos" className="mt-4 inline-block text-sm text-stone-300 underline">Open the screening room</Link>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <form className="grid gap-4 border border-line p-6 md:grid-cols-[1.2fr_1fr] md:items-end" onSubmit={async (e) => {
          e.preventDefault();
          try {
            const { data: res } = await api.post('/public/contact', { name: 'Reader', email, message: 'Please send the occasional briefing.', kind: 'subscribe', subject: 'Briefing' });
            setNote(res.message);
            setEmail('');
          } catch (err) {
            setNote(err.response?.data?.message || 'Could not save that address.');
          }
        }}>
          <div>
            <h2 className="font-serif text-3xl">The briefing</h2>
            <p className="mt-2 text-sm text-stone-600">A short list, stored in the desk. Nothing is emailed from this demo.</p>
          </div>
          <div className="flex gap-2">
            <input className="input" type="email" required placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address" />
            <button className="btn-primary">Join</button>
          </div>
          {note && <p className="text-sm text-stone-600 md:col-span-2">{note}</p>}
        </form>
      </section>
    </div>
  );
}
