import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import RichTextEditor from '../../components/RichTextEditor';
import MediaPicker from '../../components/MediaPicker';
import { Badge, Field, Modal, Spinner } from '../../components/ui';
import { slugify, toDatetimeLocal } from '../../utils/format';

const emptySeo = { title: '', description: '', canonical: '', ogTitle: '', ogDescription: '', ogImage: null };

export default function ContentEditor({ mode = 'content' }) {
  const isPage = mode === 'page';
  const base = isPage ? '/pages' : '/content';
  const listPath = isPage ? '/admin/pages' : '/admin/content';
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { can, user } = useAuth();
  const { toast, confirm } = useUI();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState('article');
  const [status, setStatus] = useState('draft');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [videos, setVideos] = useState([]);
  const [seo, setSeo] = useState(emptySeo);
  const [reviewNote, setReviewNote] = useState('');
  const [publishAt, setPublishAt] = useState('');
  const [revisions, setRevisions] = useState([]);
  const [picker, setPicker] = useState(null);
  const [preview, setPreview] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [showSeo, setShowSeo] = useState(false);
  const [showRev, setShowRev] = useState(false);
  const [authorId, setAuthorId] = useState(null);

  const owns = authorId && user && String(authorId) === String(user._id || user.id);
  const canEdit = isNew
    ? (isPage ? can('manage_pages') : can('create_content', 'manage_posts'))
    : (isPage
      ? can('manage_pages', 'edit_content')
      : can('edit_content', 'manage_posts') || (can('edit_own_content') && owns));
  const canPublish = isPage ? can('manage_pages', 'publish_content') : can('publish_content', 'manage_posts');
  const canReview = isPage ? can('manage_pages', 'review_content') : can('review_content', 'publish_content', 'manage_posts');

  useEffect(() => {
    if (!isPage) {
      api.get('/categories').then((r) => setCategories(r.data.data)).catch(() => {});
      api.get('/tags').then((r) => setAllTags(r.data.data)).catch(() => {});
    }
  }, [isPage]);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    api.get(`${base}/${id}`).then((res) => {
      const doc = res.data.data;
      setTitle(doc.title || '');
      setSlug(doc.slug || '');
      setSlugTouched(true);
      setExcerpt(doc.excerpt || '');
      setBody(doc.body || doc.content || '');
      setType(doc.type || 'article');
      setStatus(doc.deletedAt ? 'trash' : doc.status);
      setCategory(doc.category?._id || doc.category || '');
      setTags(doc.tags || []);
      setFeatured(doc.featuredImage || null);
      setGallery(doc.gallery || []);
      setVideos(doc.videos || []);
      setSeo({ ...emptySeo, ...(doc.seo || {}), ogImage: doc.seo?.ogImage || null });
      setReviewNote(doc.reviewNote || '');
      setPublishAt(toDatetimeLocal(doc.publishAt));
      setAuthorId(doc.author?._id || doc.author || null);
      setDirty(false);
    }).catch((err) => setError(errorMessage(err))).finally(() => setLoading(false));
  }, [id, isNew, base]);

  const payload = useMemo(() => {
    const data = {
      title, slug, excerpt, featuredImage: featured?._id || null,
      seo: { ...seo, ogImage: seo.ogImage?._id || seo.ogImage || null },
      forceRevision: false,
    };
    if (isPage) data.content = body;
    else {
      data.body = body;
      data.type = type;
      data.category = category || null;
      data.tags = tags.map((t) => t._id).filter(Boolean);
      data.tagNames = tags.filter((t) => !t._id).map((t) => t.name);
      data.gallery = gallery.map((g) => g._id);
      data.videos = videos.map((v) => ({
        title: v.title, description: v.description, embedUrl: v.embedUrl, captions: v.captions, source: v.source,
        media: v.media?._id || v.media || null,
        thumbnail: v.thumbnail?._id || v.thumbnail || null,
      }));
    }
    return data;
  }, [title, slug, excerpt, body, type, category, tags, featured, gallery, videos, seo, isPage]);

  const mark = (fn) => { fn(); setDirty(true); };

  useEffect(() => {
    if (isNew || !dirty || status === 'trash' || !canEdit) return undefined;
    const t = setTimeout(async () => {
      setSaveState('saving');
      try {
        await api.put(`${base}/${id}`, payload);
        setSaveState('saved');
        setDirty(false);
      } catch {
        setSaveState('error');
      }
    }, 2200);
    return () => clearTimeout(t);
  }, [dirty, payload, id, isNew, status, base, canEdit]);

  const save = async (forceRevision = true) => {
    if (!title.trim()) {
      toast('A title is required.', 'error');
      return null;
    }
    setSaving(true);
    setError('');
    try {
      const bodyPayload = { ...payload, forceRevision };
      const res = isNew ? await api.post(base, bodyPayload) : await api.put(`${base}/${id}`, bodyPayload);
      toast(res.data.message || 'Saved.');
      setDirty(false);
      setSaveState('saved');
      if (isNew) navigate(`${listPath}/${res.data.data._id}`, { replace: true });
      else setStatus(res.data.data.status);
      return res.data.data;
    } catch (err) {
      setError(errorMessage(err));
      toast(errorMessage(err), 'error');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const run = async (action, extra) => {
    let currentId = id;
    if (isNew) {
      const created = await save(false);
      if (!created) return;
      currentId = created._id;
    } else if (dirty) {
      await save(false);
    }
    try {
      const { data } = await api.post(`${base}/${currentId}/${action}`, extra || {});
      toast(data.message || 'Updated.');
      if (data.data) {
        setStatus(data.data.deletedAt ? 'trash' : data.data.status);
        setReviewNote(data.data.reviewNote || '');
        setPublishAt(toDatetimeLocal(data.data.publishAt));
      }
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const addTag = (name) => {
    const clean = name.trim();
    if (!clean) return;
    const existing = allTags.find((t) => t.name.toLowerCase() === clean.toLowerCase());
    if (tags.some((t) => (t.name || '').toLowerCase() === clean.toLowerCase())) return;
    setTags((prev) => [...prev, existing || { name: clean }]);
    setTagInput('');
    setDirty(true);
  };

  const loadRevisions = async () => {
    setShowRev(true);
    try {
      const { data } = await api.get(`${base}/${id}/revisions`);
      setRevisions(data.data);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const restoreRev = async (revId) => {
    const ok = await confirm({ title: 'Restore this revision?', message: 'The current version is kept in the history.', confirmLabel: 'Restore' });
    if (!ok) return;
    try {
      const { data } = await api.post(`${base}/${id}/revisions/${revId}/restore`);
      const doc = data.data;
      setTitle(doc.title);
      setExcerpt(doc.excerpt || '');
      setBody(doc.body || doc.content || '');
      setStatus(doc.status);
      toast(data.message);
      setShowRev(false);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  if (loading) return <div className="py-20 text-center"><Spinner /></div>;
  if (error && !title) return <p className="text-sm text-rose-700">{error}</p>;

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link to={listPath} className="text-sm text-stone-500 hover:text-ink">← Back</Link>
        <Badge status={status} />
        <span className="text-xs text-stone-500">
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'saved' && 'All changes saved'}
          {saveState === 'error' && 'Autosave failed'}
          {saveState === 'idle' && (isNew ? 'Not saved yet' : 'Loaded')}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => setPreview(true)}>Preview</button>
          <button className="btn-secondary" disabled={saving || !canEdit || status === 'trash'} onClick={() => save(true)}>{saving ? 'Saving…' : 'Save draft'}</button>
          {!isPage && canEdit && status !== 'review' && <button className="btn-secondary" onClick={() => run('submit')}>Submit for review</button>}
          {canReview && status === 'review' && <button className="btn-secondary" onClick={() => setRejectOpen(true)}>Reject</button>}
          {canReview && status === 'review' && <button className="btn-primary" onClick={() => run('approve')}>Approve & publish</button>}
          {canPublish && status !== 'published' && <button className="btn-primary" onClick={() => run('publish')}>Publish</button>}
          {canPublish && status === 'published' && <button className="btn-secondary" onClick={() => run('unpublish')}>Unpublish</button>}
        </div>
      </div>
      {status === 'trash' && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">This item is in trash. Restore it before editing.</div>}
      {!canEdit && !isNew && <div className="mb-4 rounded-xl border border-line bg-white px-4 py-3 text-sm text-stone-600">You can read this piece. Your role cannot edit it.</div>}
      {reviewNote && status === 'draft' && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">Returned with a note: {reviewNote}</div>}
      {error && <p className="mb-3 text-sm text-rose-700">{error}</p>}
      {!canPublish && !isNew && user?.role?.slug === 'author' && <p className="mb-3 text-xs text-stone-500">You can edit your own drafts and submit them. Publishing is reserved for editors.</p>}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <input className="w-full bg-transparent font-serif text-4xl outline-none placeholder:text-stone-300" placeholder="Title" value={title} onChange={(e) => { const v = e.target.value; setTitle(v); if (!slugTouched) setSlug(slugify(v)); setDirty(true); }} />
          <Field label="Slug" hint={isPage ? `Public URL: ${slug === 'about' ? '/about' : `/p/${slug || '…'}`}` : `Public URL: /blog/${slug || '…'}`}>
            <input className="input" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); setDirty(true); }} />
          </Field>
          <Field label="Short description">
            <textarea className="input min-h-20" value={excerpt} onChange={(e) => mark(() => setExcerpt(e.target.value))} />
          </Field>
          <RichTextEditor value={body} onChange={(html) => mark(() => setBody(html))} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <section className="card space-y-3 p-4">
            <h2 className="font-serif text-xl">Publish</h2>
            {!isPage && (
              <Field label="Type">
                <select className="input" value={type} onChange={(e) => mark(() => setType(e.target.value))}>
                  {['article', 'post', 'news', 'announcement'].map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
            )}
            {!isPage && (
              <Field label="Category">
                <select className="input" value={category} onChange={(e) => mark(() => setCategory(e.target.value))}>
                  <option value="">None</option>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </Field>
            )}
            {canPublish && (
              <Field label="Schedule" hint={`Times use your timezone (${zone}). The server publishes automatically.`}>
                <input className="input" type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)} />
                <button type="button" className="btn-secondary mt-2 w-full" onClick={() => run('schedule', { publishAt: new Date(publishAt).toISOString() })} disabled={!publishAt}>Schedule</button>
              </Field>
            )}
            {canEdit && status !== 'archived' && <button className="btn-ghost w-full" onClick={() => run('archive')}>Archive</button>}
            {!isNew && <button className="btn-ghost w-full" onClick={loadRevisions}>Revision history</button>}
          </section>

          {!isPage && (
            <section className="card p-4">
              <h2 className="font-serif text-xl">Tags</h2>
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <button key={tag._id || tag.name} className="rounded-full bg-stone-100 px-2 py-1 text-xs" onClick={() => mark(() => setTags(tags.filter((t) => t !== tag)))}>{tag.name} ×</button>
                ))}
              </div>
              <input className="input mt-2" placeholder="Add a tag and press Enter" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }} />
            </section>
          )}

          <section className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">Featured image</h2>
              <button className="text-xs text-copper" onClick={() => setPicker('featured')}>{featured ? 'Change' : 'Choose'}</button>
            </div>
            {featured ? (
              <div className="mt-2">
                <img src={featured.url} alt={featured.altText || ''} className="aspect-video w-full rounded-lg object-cover" />
                <button className="mt-2 text-xs text-stone-500" onClick={() => mark(() => setFeatured(null))}>Remove</button>
              </div>
            ) : <p className="mt-2 text-xs text-stone-500">No image selected.</p>}
          </section>

          {!isPage && (
            <section className="card p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl">Gallery</h2>
                <button className="text-xs text-copper" onClick={() => setPicker('gallery')}>Add</button>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {gallery.map((img) => (
                  <button key={img._id} onClick={() => mark(() => setGallery(gallery.filter((g) => g._id !== img._id)))} title="Remove">
                    <img src={img.url} alt={img.altText || ''} className="aspect-square w-full rounded-md object-cover" />
                  </button>
                ))}
              </div>
            </section>
          )}

          {!isPage && (
            <section className="card space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl">Videos</h2>
                <button className="text-xs text-copper" onClick={() => mark(() => setVideos([...videos, { title: '', description: '', embedUrl: '', captions: '', source: 'youtube' }]))}>Add embed</button>
              </div>
              {videos.map((video, index) => (
                <div key={index} className="space-y-2 rounded-lg border border-line p-2">
                  <input className="input" placeholder="Title" value={video.title || ''} onChange={(e) => mark(() => setVideos(videos.map((v, i) => i === index ? { ...v, title: e.target.value } : v)))} />
                  <textarea className="input min-h-16" placeholder="Description" value={video.description || ''} onChange={(e) => mark(() => setVideos(videos.map((v, i) => i === index ? { ...v, description: e.target.value } : v)))} />
                  <input className="input" placeholder="YouTube or Vimeo URL" value={video.embedUrl || ''} onChange={(e) => mark(() => setVideos(videos.map((v, i) => i === index ? { ...v, embedUrl: e.target.value } : v)))} />
                  <textarea className="input min-h-16" placeholder="Captions or transcript notes" value={video.captions || ''} onChange={(e) => mark(() => setVideos(videos.map((v, i) => i === index ? { ...v, captions: e.target.value } : v)))} />
                  <button className="text-xs text-rose-700" onClick={() => mark(() => setVideos(videos.filter((_, i) => i !== index)))}>Remove video</button>
                </div>
              ))}
              <button className="btn-secondary w-full" onClick={() => setPicker('video')}>Attach uploaded video</button>
            </section>
          )}

          <section className="card p-4">
            <button className="font-serif text-xl" onClick={() => setShowSeo((v) => !v)}>SEO {showSeo ? '−' : '+'}</button>
            {showSeo && (
              <div className="mt-3 space-y-2">
                {['title', 'description', 'canonical', 'ogTitle', 'ogDescription'].map((key) => (
                  <Field key={key} label={key}>
                    <input className="input" value={seo[key] || ''} onChange={(e) => mark(() => setSeo({ ...seo, [key]: e.target.value }))} />
                  </Field>
                ))}
                <button type="button" className="text-xs text-copper" onClick={() => setPicker('og')}>Choose social image</button>
                {seo.ogImage?.url && <img src={seo.ogImage.url} alt="" className="mt-2 h-20 w-full rounded object-cover" />}
              </div>
            )}
          </section>
        </aside>
      </div>

      <MediaPicker
        open={Boolean(picker)}
        kind={picker === 'video' ? 'video' : 'image'}
        title="Media library"
        onClose={() => setPicker(null)}
        onSelect={(media) => {
          if (picker === 'featured') mark(() => setFeatured(media));
          if (picker === 'gallery') mark(() => setGallery((g) => g.some((x) => x._id === media._id) ? g : [...g, media]));
          if (picker === 'og') mark(() => setSeo({ ...seo, ogImage: media }));
          if (picker === 'video') mark(() => setVideos([...videos, { title: media.title || media.originalName, description: '', embedUrl: media.url, media, source: 'upload', captions: '' }]));
          setPicker(null);
        }}
      />

      {preview && (
        <Modal title="Preview" onClose={() => setPreview(false)} wide>
          <article className="mx-auto max-w-2xl">
            <p className="text-xs uppercase tracking-wider text-copper">{isPage ? 'Page' : type}</p>
            <h2 className="font-serif text-4xl">{title || 'Untitled'}</h2>
            {excerpt && <p className="mt-3 text-lg text-stone-600">{excerpt}</p>}
            {featured && <img src={featured.url} alt={featured.altText || ''} className="mt-4 w-full rounded-xl" />}
            <div className="prose-lumen mt-6" dangerouslySetInnerHTML={{ __html: body || '<p>Nothing written yet.</p>' }} />
          </article>
        </Modal>
      )}
      {rejectOpen && (
        <Modal title="Send back to draft" onClose={() => setRejectOpen(false)}>
          <textarea className="input min-h-28" placeholder="What should the author change?" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn-primary mt-3" onClick={() => { setRejectOpen(false); run('reject', { note }); }}>Reject</button>
        </Modal>
      )}
      {showRev && (
        <Modal title="Revision history" onClose={() => setShowRev(false)}>
          {!revisions.length && <p className="text-sm text-stone-500">No earlier versions yet. They are stored as you save.</p>}
          <ul className="space-y-3">
            {revisions.map((rev) => (
              <li key={rev._id} className="rounded-lg border border-line p-3 text-sm">
                <p className="font-medium">{rev.note || 'Saved'} · {rev.status}</p>
                <p className="text-xs text-stone-500">{new Date(rev.updatedAt).toLocaleString()} · {rev.updatedBy?.name || 'Unknown'}</p>
                <p className="mt-1 line-clamp-2 text-stone-600">{rev.title}</p>
                <button className="mt-2 text-xs text-copper" onClick={() => restoreRev(rev._id)}>Restore</button>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
}
