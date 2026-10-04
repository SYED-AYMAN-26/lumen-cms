import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import api, { errorMessage } from '../../services/api';
import { useSeo } from '../../hooks/useSeo';
import { Cover, Pagination, Spinner } from '../../components/ui';
import { formatDate, readingTime } from '../../utils/format';

function StoryCard({ story }) {
  return (
    <article>
      <Link to={`/blog/${story.slug}`}>
        <Cover src={story.featuredImage?.url} alt={story.featuredImage?.altText || ''} className="aspect-[16/10] w-full" />
        <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-stone-500">{story.category?.name} · {formatDate(story.publishedAt)}</p>
        <h2 className="mt-1 font-serif text-2xl leading-tight">{story.title}</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">{story.excerpt}</p>
      </Link>
    </article>
  );
}

export function Blog() {
  const site = useOutletContext();
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const category = params.get('category') || '';
  const page = Number(params.get('page') || 1);
  useSeo({ title: 'Journal', description: 'Published essays and notes.', siteName: site?.settings?.siteName });

  useEffect(() => {
    setLoading(true);
    api.get('/public/posts', { params: { page, category: category || undefined, limit: site?.settings?.postsPerPage } })
      .then((res) => { setItems(res.data.data); setMeta(res.data.meta); })
      .finally(() => setLoading(false));
  }, [page, category, site?.settings?.postsPerPage]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-copper">Journal</p>
      <h1 className="mt-2 font-serif text-5xl">Published work</h1>
      <div className="mt-6 flex flex-wrap gap-2 text-sm">
        <button className={!category ? 'btn-primary' : 'btn-secondary'} onClick={() => setParams({})}>All</button>
        {(site?.categories || []).map((cat) => (
          <button key={cat.slug} className={category === cat.slug ? 'btn-primary' : 'btn-secondary'} onClick={() => setParams({ category: cat.slug })}>{cat.name}</button>
        ))}
      </div>
      {loading ? <div className="py-16"><Spinner /></div> : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((story) => <StoryCard key={story.slug} story={story} />)}
        </div>
      )}
      {!loading && !items.length && <p className="mt-8 text-sm text-stone-500">Nothing published in this section yet.</p>}
      <Pagination page={meta.page} pages={meta.pages} onPage={(n) => setParams({ ...(category ? { category } : {}), page: String(n) })} />
    </div>
  );
}

export function CategoryPage() {
  const { slug } = useParams();
  const site = useOutletContext();
  const cat = (site?.categories || []).find((c) => c.slug === slug);
  const [items, setItems] = useState(null);
  useSeo({ title: cat?.name || 'Category', description: cat?.description, siteName: site?.settings?.siteName });
  useEffect(() => {
    api.get('/public/posts', { params: { category: slug, limit: 24 } }).then((res) => setItems(res.data.data));
  }, [slug]);
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-copper">Section</p>
      <h1 className="mt-2 font-serif text-5xl">{cat?.name || slug}</h1>
      <p className="mt-3 max-w-xl text-stone-600">{cat?.description}</p>
      {!items ? <Spinner /> : (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((story) => <StoryCard key={story.slug} story={story} />)}
        </div>
      )}
    </div>
  );
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [value, setValue] = useState(q);
  const [data, setData] = useState(null);
  const site = useOutletContext();
  useSeo({ title: q ? `Search: ${q}` : 'Search', siteName: site?.settings?.siteName });
  useEffect(() => {
    if (q.length < 2) { setData({ posts: [], pages: [] }); return; }
    api.get('/public/search', { params: { q } }).then((res) => setData(res.data.data));
  }, [q]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-serif text-5xl">Search</h1>
      <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); setParams({ q: value }); }}>
        <input className="input" value={value} onChange={(e) => setValue(e.target.value)} aria-label="Search query" />
        <button className="btn-primary">Search</button>
      </form>
      {!data ? <Spinner /> : (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="label">Stories</h2>
            {data.posts.map((story) => (
              <Link key={story.slug} to={`/blog/${story.slug}`} className="mt-4 block border-b border-line py-3">
                <span className="font-serif text-2xl">{story.title}</span>
                <span className="mt-1 block text-sm text-stone-600">{story.excerpt}</span>
              </Link>
            ))}
            {!data.posts.length && <p className="mt-3 text-sm text-stone-500">No published stories matched.</p>}
          </section>
          <section>
            <h2 className="label">Pages</h2>
            {data.pages.map((page) => (
              <Link key={page.slug} to={page.slug === 'about' ? '/about' : `/p/${page.slug}`} className="mt-3 block">{page.title}</Link>
            ))}
            {!data.pages.length && <p className="mt-3 text-sm text-stone-500">No pages matched.</p>}
          </section>
        </div>
      )}
    </div>
  );
}

export function Article() {
  const { slug } = useParams();
  const site = useOutletContext();
  const [story, setStory] = useState(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    setMissing(false);
    setStory(null);
    api.get(`/public/posts/${slug}`).then((res) => setStory(res.data.data)).catch(() => setMissing(true));
  }, [slug]);
  useSeo({
    title: story?.seo?.title || story?.title,
    description: story?.seo?.description,
    image: story?.seo?.ogImage,
    siteName: site?.settings?.siteName,
  });
  if (missing) return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="font-serif text-4xl">This story is not on the public site.</h1><Link to="/blog" className="mt-4 inline-block text-copper">Back to the journal</Link></div>;
  if (!story) return <div className="py-24 text-center"><Spinner /></div>;
  return <StoryView story={story} />;
}

export function StoryView({ story, kicker = 'Journal' }) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="text-[11px] uppercase tracking-[0.16em] text-copper">{story.category?.name || kicker}</p>
      <h1 className="mt-3 font-serif text-4xl leading-tight md:text-6xl">{story.title}</h1>
      {story.excerpt && <p className="mt-4 text-xl leading-8 text-stone-600">{story.excerpt}</p>}
      <p className="mt-4 text-sm text-stone-500">{story.author?.name} · {formatDate(story.publishedAt)} · {readingTime(story.body)} min read</p>
      {story.featuredImage?.url && (
        <figure className="mt-8">
          <img src={story.featuredImage.url} alt={story.featuredImage.altText || ''} className="w-full" />
          {story.featuredImage.caption && <figcaption className="mt-2 text-xs text-stone-500">{story.featuredImage.caption}</figcaption>}
        </figure>
      )}
      <div className="prose-lumen mt-8" dangerouslySetInnerHTML={{ __html: story.body || '' }} />
      {!!story.videos?.length && (
        <section className="mt-10 space-y-6">
          {story.videos.map((video, i) => (
            <figure key={i}>
              {video.embedUrl?.includes('youtube.com') || video.embedUrl?.includes('vimeo.com') ? (
                <iframe title={video.title || 'Video'} src={video.embedUrl} className="aspect-video w-full" allowFullScreen />
              ) : video.embedUrl ? <video controls src={video.embedUrl} className="w-full" poster={video.thumbnail?.url} /> : null}
              {video.title && <figcaption className="mt-2 text-sm">{video.title}{video.description ? ` — ${video.description}` : ''}</figcaption>}
              {video.captions && <p className="mt-1 text-xs text-stone-500">{video.captions}</p>}
            </figure>
          ))}
        </section>
      )}
      {!!story.tags?.length && (
        <p className="mt-8 text-sm text-stone-500">{story.tags.map((t) => t.name).join(' · ')}</p>
      )}
      {story.author?.bio && <p className="mt-6 border-t border-line pt-4 text-sm text-stone-600">{story.author.name}. {story.author.bio}</p>}
      {!!story.related?.length && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl">Further reading</h2>
          <ul className="mt-3 space-y-2">
            {story.related.map((item) => <li key={item.slug}><Link className="hover:text-copper" to={`/blog/${item.slug}`}>{item.title}</Link></li>)}
          </ul>
        </section>
      )}
    </article>
  );
}

export function CmsPage({ slug: forcedSlug }) {
  const params = useParams();
  const slug = forcedSlug || params.slug;
  const site = useOutletContext();
  const [page, setPage] = useState(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    setPage(null);
    setMissing(false);
    api.get(`/public/pages/${slug}`).then((res) => setPage(res.data.data)).catch(() => setMissing(true));
  }, [slug]);
  useSeo({ title: page?.seo?.title || page?.title, description: page?.seo?.description, siteName: site?.settings?.siteName });
  if (missing) return <div className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="font-serif text-4xl">That page is not published.</h1></div>;
  if (!page) return <div className="py-24 text-center"><Spinner /></div>;
  return <StoryView story={{ ...page, body: page.body || page.content }} kicker="Page" />;
}

void errorMessage;
