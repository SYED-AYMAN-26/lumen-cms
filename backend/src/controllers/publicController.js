import Content from '../models/Content.js';
import Page from '../models/Page.js';
import Category from '../models/Category.js';
import Media from '../models/Media.js';
import Setting from '../models/Setting.js';
import ContactMessage from '../models/ContactMessage.js';
import { asyncHandler, HttpError, escapeRegex, parsePagination, textFromHtml, toEmbedUrl } from '../utils/helpers.js';
import { logActivity } from '../services/activity.js';

const published = { status: 'published', deletedAt: null };

function shapeMedia(m) {
  if (!m) return null;
  return { id: m._id, url: m.url, altText: m.altText, caption: m.caption, title: m.title, width: m.width, height: m.height, kind: m.kind };
}

function shapePost(doc, { withBody = false } = {}) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  const videos = (o.videos || []).map((v) => ({
    title: v.title,
    description: v.description,
    embedUrl: toEmbedUrl(v.embedUrl) || (v.media?.url || ''),
    thumbnail: shapeMedia(v.thumbnail),
    captions: v.captions,
    source: v.source,
  })).filter((v) => v.embedUrl);
  return {
    id: o._id,
    title: o.title,
    slug: o.slug,
    excerpt: o.excerpt || textFromHtml(o.body || o.content).slice(0, 220),
    body: withBody ? (o.body || o.content || '') : undefined,
    type: o.type,
    status: o.status,
    publishedAt: o.publishedAt || o.publishAt || o.createdAt,
    updatedAt: o.updatedAt,
    featuredImage: shapeMedia(o.featuredImage),
    gallery: (o.gallery || []).map(shapeMedia).filter(Boolean),
    videos,
    author: o.author ? { name: o.author.name, bio: o.author.bio, avatar: o.author.avatar } : null,
    category: o.category ? { name: o.category.name, slug: o.category.slug } : null,
    tags: (o.tags || []).map((t) => ({ name: t.name, slug: t.slug })),
    seo: {
      title: o.seo?.title || o.title,
      description: o.seo?.description || o.excerpt,
      canonical: o.seo?.canonical || '',
      ogTitle: o.seo?.ogTitle || o.seo?.title || o.title,
      ogDescription: o.seo?.ogDescription || o.seo?.description || o.excerpt,
      ogImage: o.seo?.ogImage?.url || o.featuredImage?.url || '',
    },
  };
}

export const bootstrap = asyncHandler(async (_req, res) => {
  const settings = await Setting.getSite();
  await settings.populate('general.logo');
  const categories = await Category.find().sort({ name: 1 });
  const counts = await Content.aggregate([
    { $match: published },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json({
    success: true,
    data: {
      settings: {
        siteName: settings.general.siteName,
        description: settings.general.description,
        logo: settings.general.logo?.url || '',
        contactEmail: settings.general.contactEmail,
        postsPerPage: settings.content.postsPerPage || 9,
      },
      categories: categories.map((c) => ({ name: c.name, slug: c.slug, description: c.description, count: map[String(c._id)] || 0 })),
    },
  });
});

export const home = asyncHandler(async (_req, res) => {
  const posts = await Content.find(published)
    .populate('featuredImage')
    .populate('author', 'name bio avatar')
    .populate('category', 'name slug')
    .populate('tags', 'name slug')
    .sort({ publishedAt: -1, createdAt: -1 })
    .limit(12);
  const featuredDoc = posts.find((p) => p.type === 'article' && p.featuredImage) || posts.find((p) => p.type === 'article') || posts[0];
  const rest = posts.filter((p) => String(p._id) !== String(featuredDoc?._id));
  const withVideo = await Content.find({ ...published, 'videos.0': { $exists: true } })
    .populate('featuredImage')
    .populate('videos.thumbnail')
    .sort({ publishedAt: -1 })
    .limit(3);
  res.json({
    success: true,
    data: {
      featured: shapePost(featuredDoc),
      stories: rest.slice(0, 3).map((p) => shapePost(p)),
      latest: posts.slice(0, 8).map((p) => shapePost(p)),
      videos: withVideo.map((p) => shapePost(p)),
    },
  });
});

export const posts = asyncHandler(async (req, res) => {
  const settings = await Setting.getSite();
  const { page, limit, skip } = parsePagination(req.query, settings.content.postsPerPage || 9);
  const filter = { ...published };
  if (req.query.category) {
    const cat = await Category.findOne({ slug: req.query.category });
    if (!cat) return res.json({ success: true, data: [], meta: { page, limit, total: 0, pages: 1 } });
    filter.category = cat._id;
  }
  if (req.query.tag) filter['tags'] = { $exists: true };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ title: rx }, { excerpt: rx }];
  }
  let q = Content.find(filter);
  if (req.query.tag) {
    const Tag = (await import('../models/Tag.js')).default;
    const tag = await Tag.findOne({ slug: req.query.tag });
    if (!tag) return res.json({ success: true, data: [], meta: { page, limit, total: 0, pages: 1 } });
    q = Content.find({ ...filter, tags: tag._id });
  }
  const [items, total] = await Promise.all([
    q.populate('featuredImage').populate('author', 'name').populate('category', 'name slug').populate('tags', 'name slug')
      .sort({ publishedAt: -1 }).skip(skip).limit(limit),
    Content.countDocuments(q.getFilter()),
  ]);
  res.json({ success: true, data: items.map((p) => shapePost(p)), meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const postBySlug = asyncHandler(async (req, res) => {
  const doc = await Content.findOne({ slug: req.params.slug, ...published })
    .populate('featuredImage')
    .populate('gallery')
    .populate('videos.thumbnail')
    .populate('videos.media')
    .populate('author', 'name bio avatar')
    .populate('category', 'name slug')
    .populate('tags', 'name slug')
    .populate('seo.ogImage');
  if (!doc) throw new HttpError(404, 'This story is not available.');
  const related = await Content.find({ ...published, _id: { $ne: doc._id }, category: doc.category })
    .populate('featuredImage').populate('category', 'name slug').sort({ publishedAt: -1 }).limit(3);
  res.json({ success: true, data: { ...shapePost(doc, { withBody: true }), related: related.map((p) => shapePost(p)) } });
});

export const pageBySlug = asyncHandler(async (req, res) => {
  const doc = await Page.findOne({ slug: req.params.slug, ...published }).populate('featuredImage').populate('seo.ogImage').populate('author', 'name');
  if (!doc) throw new HttpError(404, 'Page not found.');
  res.json({
    success: true,
    data: {
      ...shapePost({ ...doc.toObject(), body: doc.content }, { withBody: true }),
      content: doc.content,
    },
  });
});

export const gallery = asyncHandler(async (_req, res) => {
  const postsWith = await Content.find({ ...published, $or: [{ gallery: { $ne: [] } }, { featuredImage: { $ne: null } }] })
    .populate('featuredImage').populate('gallery').select('title slug featuredImage gallery');
  const images = [];
  for (const post of postsWith) {
    if (post.featuredImage) images.push({ ...shapeMedia(post.featuredImage), story: post.title, slug: post.slug });
    for (const img of post.gallery || []) images.push({ ...shapeMedia(img), story: post.title, slug: post.slug });
  }
  const loose = await Media.find({ isPublic: true, kind: 'image' }).sort({ createdAt: -1 }).limit(40);
  for (const img of loose) images.push({ ...shapeMedia(img), story: '', slug: '' });
  const seen = new Set();
  const unique = images.filter((img) => img?.url && !seen.has(img.url) && seen.add(img.url));
  res.json({ success: true, data: unique });
});

export const videos = asyncHandler(async (_req, res) => {
  const docs = await Content.find({ ...published, 'videos.0': { $exists: true } })
    .populate('featuredImage').populate('videos.thumbnail').populate('videos.media').populate('author', 'name')
    .sort({ publishedAt: -1 });
  const items = [];
  for (const doc of docs) {
    const shaped = shapePost(doc);
    for (const video of shaped.videos) {
      items.push({ ...video, story: doc.title, slug: doc.slug, thumbnail: video.thumbnail || shaped.featuredImage });
    }
  }
  res.json({ success: true, data: items });
});

export const search = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ success: true, data: { posts: [], pages: [] }, meta: { q } });
  const rx = new RegExp(escapeRegex(q), 'i');
  const [posts, pages] = await Promise.all([
    Content.find({ ...published, $or: [{ title: rx }, { excerpt: rx }, { body: rx }] })
      .populate('featuredImage').populate('category', 'name slug').sort({ publishedAt: -1 }).limit(20),
    Page.find({ ...published, $or: [{ title: rx }, { excerpt: rx }, { content: rx }] }).select('title slug excerpt').limit(10),
  ]);
  res.json({
    success: true,
    data: {
      posts: posts.map((p) => shapePost(p)),
      pages: pages.map((p) => ({ title: p.title, slug: p.slug, excerpt: p.excerpt })),
    },
    meta: { q },
  });
});

export const contact = asyncHandler(async (req, res) => {
  const strip = (value, max) => String(value || '').replace(/<[^>]+>/g, '').trim().slice(0, max);
  const name = strip(req.body.name, 80);
  const email = strip(req.body.email, 160);
  const message = strip(req.body.message, 4000);
  const subject = strip(req.body.subject, 160);
  const kind = req.body.kind === 'subscribe' ? 'subscribe' : 'contact';
  if (!name || !email || !message) throw new HttpError(400, 'Name, email, and a message are required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  const doc = await ContactMessage.create({ name, email, message, subject, kind });
  await logActivity(req, { action: 'contact.received', resourceType: 'contact', resourceId: doc._id, metadata: { title: subject || email }, userId: null });
  res.status(201).json({
    success: true,
    message: kind === 'subscribe' ? 'You are on the list. This is a local demo, so nothing will be emailed.' : 'Message received. Thank you.',
  });
});
