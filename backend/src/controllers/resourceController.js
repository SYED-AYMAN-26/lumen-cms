import Setting from '../models/Setting.js';
import Tag from '../models/Tag.js';
import Category from '../models/Category.js';
import { logActivity } from '../services/activity.js';
import {
  asyncHandler,
  HttpError,
  hasAny,
  canEditDoc,
  uniqueSlug,
  slugify,
  sanitizeContent,
  parsePagination,
  escapeRegex,
  textFromHtml,
  sanitizeVideos,
  RESERVED_PAGE_SLUGS,
} from '../utils/helpers.js';

async function resolveTags(ids = [], names = []) {
  const out = [];
  for (const id of ids || []) {
    if (id) out.push(id);
  }
  for (const name of names || []) {
    const clean = String(name).trim().slice(0, 40);
    if (!clean) continue;
    const slug = slugify(clean);
    if (!slug) continue;
    let tag = await Tag.findOne({ slug });
    if (!tag) tag = await Tag.create({ name: clean, slug });
    out.push(tag._id);
  }
  return out;
}

export function createPublishingController(config) {
  const {
    Model,
    resourceType,
    bodyKey,
    listPopulate,
    detailPopulate,
    createPerms,
    editAnyPerms,
    deletePerms,
    publishPerms,
    reviewPerms,
  } = config;

  const getBody = (doc) => doc[bodyKey] || '';
  const setBody = (doc, html) => {
    doc[bodyKey] = sanitizeContent(html || '');
  };

  function pushRevision(doc, user, note) {
    doc.revisions.push({
      title: doc.title,
      excerpt: doc.excerpt || '',
      body: getBody(doc),
      status: doc.status,
      updatedBy: user?._id,
      updatedAt: new Date(),
      note: note || 'Saved',
    });
    if (doc.revisions.length > 25) {
      doc.revisions = doc.revisions.slice(-25);
    }
  }

  async function load(id) {
    let q = Model.findById(id);
    if (detailPopulate) q = q.populate(detailPopulate);
    return q;
  }

  async function applyWrite(doc, body, isNew, user) {
    if (body.title !== undefined) doc.title = String(body.title).trim().slice(0, 180);
    if (!doc.title) throw new HttpError(400, 'Title is required.');

    if (body.excerpt !== undefined) doc.excerpt = String(body.excerpt || '').slice(0, 500);
    if (body[bodyKey] !== undefined || body.body !== undefined || body.content !== undefined) {
      setBody(doc, body[bodyKey] ?? body.body ?? body.content ?? '');
    } else if (isNew) {
      setBody(doc, '');
    }

    if (body.slug !== undefined && String(body.slug).trim()) {
      doc.slug = await uniqueSlug(Model, body.slug, doc._id);
    } else if (isNew || !doc.slug) {
      doc.slug = await uniqueSlug(Model, doc.title, doc._id);
    }

    if (resourceType === 'page' && RESERVED_PAGE_SLUGS.has(doc.slug)) {
      throw new HttpError(400, 'That URL slug is reserved. Choose another.');
    }

    if (body.featuredImage !== undefined) doc.featuredImage = body.featuredImage || null;

    if (body.seo) {
      doc.seo = {
        title: String(body.seo.title || '').slice(0, 180),
        description: String(body.seo.description || '').slice(0, 300),
        canonical: String(body.seo.canonical || '').slice(0, 300),
        ogTitle: String(body.seo.ogTitle || '').slice(0, 180),
        ogDescription: String(body.seo.ogDescription || '').slice(0, 300),
        ogImage: body.seo.ogImage || null,
      };
    }

    if (resourceType === 'content') {
      if (body.type) {
        if (!['post', 'article', 'news', 'announcement'].includes(body.type)) {
          throw new HttpError(400, 'Unknown content type.');
        }
        doc.type = body.type;
      }
      if (body.category !== undefined) {
        if (!body.category) doc.category = null;
        else {
          const exists = await Category.exists({ _id: body.category });
          if (!exists) throw new HttpError(400, 'Category not found.');
          doc.category = body.category;
        }
      }
      if (body.tags || body.tagNames) {
        doc.tags = await resolveTags(body.tags || [], body.tagNames || []);
      }
      if (body.gallery) {
        doc.gallery = Array.isArray(body.gallery) ? body.gallery.filter(Boolean).slice(0, 24) : [];
      }
      if (body.videos) doc.videos = sanitizeVideos(body.videos);
    }

    doc.updatedBy = user._id;
  }

  async function findEditable(req, { perm, allowEditor = false } = {}) {
    const doc = await Model.findById(req.params.id);
    if (!doc || doc.deletedAt) throw new HttpError(404, 'Not found.');
    if (perm && hasAny(req.user, perm)) return doc;
    if (allowEditor && canEditDoc(req.user, doc, editAnyPerms)) return doc;
    throw new HttpError(403, 'You do not have permission to perform this action.');
  }

  const list = asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, 12);
    const filter = {};
    const trash = req.query.trash === '1' || req.query.status === 'trash';
    if (trash) filter.deletedAt = { $ne: null };
    else {
      filter.deletedAt = null;
      if (req.query.status) filter.status = req.query.status;
    }
    if (req.query.type && resourceType === 'content') filter.type = req.query.type;
    if (req.query.category && resourceType === 'content') filter.category = req.query.category;
    if (req.query.author) filter.author = req.query.author === 'me' ? req.user._id : req.query.author;
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
      if (req.query.to) {
        const to = new Date(req.query.to);
        if (!Number.isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          filter.createdAt.$lte = to;
        }
      }
    }
    if (req.query.search) {
      const rx = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = [{ title: rx }, { excerpt: rx }, { slug: rx }];
    }

    let q = Model.find(filter).select(`-${bodyKey} -revisions`).sort({ updatedAt: -1 }).skip(skip).limit(limit);
    if (listPopulate) q = q.populate(listPopulate);
    const [items, total] = await Promise.all([q, Model.countDocuments(filter)]);
    res.json({
      success: true,
      data: items,
      meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
    });
  });

  const getOne = asyncHandler(async (req, res) => {
    const doc = await load(req.params.id);
    if (!doc) throw new HttpError(404, 'Not found.');
    const editable = canEditDoc(req.user, doc, editAnyPerms);
    res.json({ success: true, data: doc, meta: { editable } });
  });

  const create = asyncHandler(async (req, res) => {
    if (!hasAny(req.user, createPerms)) throw new HttpError(403, 'You do not have permission to create this.');
    const doc = new Model({ author: req.user._id, status: 'draft', [bodyKey]: '' });
    await applyWrite(doc, req.body, true, req.user);
    await doc.save();
    await logActivity(req, {
      action: `${resourceType}.created`,
      resourceType,
      resourceId: doc._id,
      metadata: { title: doc.title },
    });
    res.status(201).json({ success: true, data: await load(doc._id), message: 'Draft saved.' });
  });

  const update = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new HttpError(404, 'Not found.');
    if (doc.deletedAt) throw new HttpError(400, 'Restore this item from trash before editing.');
    if (!canEditDoc(req.user, doc, editAnyPerms)) {
      throw new HttpError(403, 'You can only edit your own content.');
    }
    const incoming = req.body[bodyKey] ?? req.body.body ?? req.body.content;
    const changed = (incoming !== undefined && incoming !== getBody(doc)) || (req.body.title && req.body.title !== doc.title);
    const last = doc.revisions[doc.revisions.length - 1];
    const recent = last && Date.now() - new Date(last.updatedAt).getTime() < 2 * 60 * 1000;
    if (changed && (req.body.forceRevision || !recent)) pushRevision(doc, req.user, req.body.forceRevision ? 'Saved' : 'Autosave');
    await applyWrite(doc, req.body, false, req.user);
    await doc.save();
    if (req.body.forceRevision) {
      await logActivity(req, {
        action: `${resourceType}.updated`,
        resourceType,
        resourceId: doc._id,
        metadata: { title: doc.title },
      });
    }
    res.json({ success: true, data: await load(doc._id), message: 'Saved.' });
  });

  const publish = asyncHandler(async (req, res) => {
    const doc = await findEditable(req, { perm: publishPerms });
    pushRevision(doc, req.user, 'Published');
    doc.status = 'published';
    doc.publishedAt = new Date();
    doc.publishAt = doc.publishAt && doc.publishAt > new Date() ? new Date() : doc.publishAt || new Date();
    if (!doc.excerpt) doc.excerpt = textFromHtml(getBody(doc)).slice(0, 240);
    if (resourceType === 'content' && !doc.category) {
      const settings = await Setting.getSite();
      if (settings.content?.defaultCategory) doc.category = settings.content.defaultCategory;
    }
    doc.updatedBy = req.user._id;
    await doc.save();
    await logActivity(req, { action: `${resourceType}.published`, resourceType, resourceId: doc._id, metadata: { title: doc.title } });
    res.json({ success: true, data: await load(doc._id), message: 'Published. It is now on the public site.' });
  });

  const unpublish = asyncHandler(async (req, res) => {
    const doc = await findEditable(req, { perm: publishPerms });
    pushRevision(doc, req.user, 'Unpublished');
    doc.status = 'draft';
    doc.updatedBy = req.user._id;
    await doc.save();
    await logActivity(req, { action: `${resourceType}.unpublished`, resourceType, resourceId: doc._id, metadata: { title: doc.title } });
    res.json({ success: true, data: await load(doc._id), message: 'Unpublished. It is now a draft.' });
  });

  const submit = asyncHandler(async (req, res) => {
    const doc = await findEditable(req, { allowEditor: true });
    if (!['draft', 'archived', 'review'].includes(doc.status)) {
      throw new HttpError(400, 'Only drafts can be submitted for review.');
    }
    pushRevision(doc, req.user, 'Submitted for review');
    doc.status = 'review';
    doc.updatedBy = req.user._id;
    await doc.save();
    await logActivity(req, { action: `${resourceType}.submitted`, resourceType, resourceId: doc._id, metadata: { title: doc.title } });
    res.json({ success: true, data: await load(doc._id), message: 'Submitted for review.' });
  });

  const approve = asyncHandler(async (req, res) => {
    const doc = await findEditable(req, { perm: reviewPerms });
    pushRevision(doc, req.user, 'Approved');
    doc.status = 'published';
    doc.publishedAt = new Date();
    doc.reviewNote = '';
    if (!doc.excerpt) doc.excerpt = textFromHtml(getBody(doc)).slice(0, 240);
    doc.updatedBy = req.user._id;
    await doc.save();
    await logActivity(req, { action: `${resourceType}.approved`, resourceType, resourceId: doc._id, metadata: { title: doc.title } });
    res.json({ success: true, data: await load(doc._id), message: 'Approved and published.' });
  });

  const reject = asyncHandler(async (req, res) => {
    const doc = await findEditable(req, { perm: reviewPerms });
    pushRevision(doc, req.user, 'Rejected');
    doc.status = 'draft';
    doc.reviewNote = String(req.body.note || 'Returned to the author.').slice(0, 1000);
    doc.updatedBy = req.user._id;
    await doc.save();
    await logActivity(req, { action: `${resourceType}.rejected`, resourceType, resourceId: doc._id, metadata: { title: doc.title } });
    res.json({ success: true, data: await load(doc._id), message: 'Returned to draft.' });
  });

  const schedule = asyncHandler(async (req, res) => {
    const doc = await findEditable(req, { perm: publishPerms });
    const when = new Date(req.body.publishAt);
    if (Number.isNaN(when.getTime())) throw new HttpError(400, 'Choose a valid publish date and time.');
    pushRevision(doc, req.user, 'Scheduled');
    doc.publishAt = when;
    if (when.getTime() <= Date.now()) {
      doc.status = 'published';
      doc.publishedAt = new Date();
    } else {
      doc.status = 'scheduled';
    }
    doc.updatedBy = req.user._id;
    await doc.save();
    await logActivity(req, { action: `${resourceType}.scheduled`, resourceType, resourceId: doc._id, metadata: { title: doc.title, publishAt: when } });
    const message = doc.status === 'published'
      ? 'That time has passed, so the item was published now.'
      : 'Scheduled. It will publish automatically.';
    res.json({ success: true, data: await load(doc._id), message });
  });

  const archive = asyncHandler(async (req, res) => {
    const doc = await findEditable(req, { allowEditor: true, perm: editAnyPerms });
    pushRevision(doc, req.user, 'Archived');
    doc.status = 'archived';
    doc.updatedBy = req.user._id;
    await doc.save();
    await logActivity(req, { action: `${resourceType}.archived`, resourceType, resourceId: doc._id, metadata: { title: doc.title } });
    res.json({ success: true, data: await load(doc._id), message: 'Archived.' });
  });

  const remove = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc || doc.deletedAt) throw new HttpError(404, 'Not found.');
    if (!hasAny(req.user, deletePerms)) throw new HttpError(403, 'You do not have permission to delete this.');
    doc.status = 'trash';
    doc.deletedAt = new Date();
    doc.deletedBy = req.user._id;
    doc.updatedBy = req.user._id;
    await doc.save();
    await logActivity(req, { action: `${resourceType}.deleted`, resourceType, resourceId: doc._id, metadata: { title: doc.title } });
    res.json({ success: true, message: 'Moved to trash.' });
  });

  const restore = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc || !doc.deletedAt) throw new HttpError(404, 'Not found in trash.');
    if (!hasAny(req.user, deletePerms)) throw new HttpError(403, 'You do not have permission to restore this.');
    doc.deletedAt = null;
    doc.deletedBy = null;
    doc.status = 'draft';
    doc.updatedBy = req.user._id;
    await doc.save();
    await logActivity(req, { action: `${resourceType}.restored`, resourceType, resourceId: doc._id, metadata: { title: doc.title } });
    res.json({ success: true, data: await load(doc._id), message: 'Restored as a draft.' });
  });

  const destroy = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new HttpError(404, 'Not found.');
    if (!doc.deletedAt) throw new HttpError(400, 'Move the item to trash before deleting it permanently.');
    if (!hasAny(req.user, deletePerms)) throw new HttpError(403, 'You do not have permission to delete this.');
    await doc.deleteOne();
    await logActivity(req, { action: `${resourceType}.destroyed`, resourceType, resourceId: doc._id, metadata: { title: doc.title } });
    res.json({ success: true, message: 'Permanently deleted.' });
  });

  const duplicate = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc) throw new HttpError(404, 'Not found.');
    if (!hasAny(req.user, createPerms) && !canEditDoc(req.user, doc, editAnyPerms)) {
      throw new HttpError(403, 'You do not have permission to duplicate this.');
    }
    const obj = doc.toObject();
    delete obj._id;
    delete obj.createdAt;
    delete obj.updatedAt;
    obj.revisions = [];
    obj.status = 'draft';
    obj.deletedAt = null;
    obj.deletedBy = null;
    obj.publishedAt = null;
    obj.publishAt = null;
    obj.reviewNote = '';
    obj.author = req.user._id;
    obj.updatedBy = req.user._id;
    obj.title = `Copy of ${doc.title}`.slice(0, 180);
    obj.slug = await uniqueSlug(Model, `${doc.slug}-copy`);
    const copy = await Model.create(obj);
    await logActivity(req, { action: `${resourceType}.duplicated`, resourceType, resourceId: copy._id, metadata: { title: copy.title } });
    res.status(201).json({ success: true, data: await load(copy._id), message: 'Duplicate saved as a draft.' });
  });

  const revisions = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id).populate('revisions.updatedBy', 'name email');
    if (!doc) throw new HttpError(404, 'Not found.');
    const items = [...(doc.revisions || [])].reverse();
    res.json({ success: true, data: items });
  });

  const restoreRevision = asyncHandler(async (req, res) => {
    const doc = await Model.findById(req.params.id);
    if (!doc || doc.deletedAt) throw new HttpError(404, 'Not found.');
    if (!canEditDoc(req.user, doc, editAnyPerms)) throw new HttpError(403, 'You can only edit your own content.');
    const rev = doc.revisions.id(req.params.revId);
    if (!rev) throw new HttpError(404, 'Revision not found.');
    pushRevision(doc, req.user, 'Before restoring a revision');
    doc.title = rev.title || doc.title;
    doc.excerpt = rev.excerpt || '';
    setBody(doc, rev.body || '');
    let next = rev.status && rev.status !== 'trash' ? rev.status : 'draft';
    if (['published', 'scheduled'].includes(next) && !hasAny(req.user, publishPerms)) next = 'draft';
    doc.status = next;
    doc.updatedBy = req.user._id;
    await doc.save();
    await logActivity(req, { action: `${resourceType}.updated`, resourceType, resourceId: doc._id, metadata: { title: doc.title, restoredRevision: true } });
    res.json({ success: true, data: await load(doc._id), message: 'Revision restored.' });
  });

  return {
    list, getOne, create, update, publish, unpublish, submit, approve, reject,
    schedule, archive, remove, restore, destroy, duplicate, revisions, restoreRevision,
  };
}
