import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import Content from '../models/Content.js';
import { asyncHandler, HttpError, slugify, uniqueSlug, escapeRegex, hasAny } from '../utils/helpers.js';
import { logActivity } from '../services/activity.js';

export const listCategories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ name: rx }, { slug: rx }, { description: rx }];
  }
  const categories = await Category.find(filter).populate('image').sort({ name: 1 });
  const counts = await Content.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json({
    success: true,
    data: categories.map((c) => ({ ...c.toObject(), contentCount: map[String(c._id)] || 0 })),
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) throw new HttpError(400, 'Category name is required.');
  const slug = await uniqueSlug(Category, req.body.slug || name);
  const category = await Category.create({
    name: name.slice(0, 80),
    slug,
    description: String(req.body.description || '').slice(0, 400),
    image: req.body.image || null,
  });
  await logActivity(req, { action: 'category.created', resourceType: 'category', resourceId: category._id, metadata: { title: category.name } });
  res.status(201).json({ success: true, data: category, message: 'Category created.' });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, 'Category not found.');
  if (req.body.name !== undefined) category.name = String(req.body.name).trim().slice(0, 80);
  if (!category.name) throw new HttpError(400, 'Category name is required.');
  if (req.body.slug !== undefined) category.slug = await uniqueSlug(Category, req.body.slug || category.name, category._id);
  if (req.body.description !== undefined) category.description = String(req.body.description).slice(0, 400);
  if (req.body.image !== undefined) category.image = req.body.image || null;
  await category.save();
  await logActivity(req, { action: 'category.updated', resourceType: 'category', resourceId: category._id, metadata: { title: category.name } });
  res.json({ success: true, data: category, message: 'Category updated.' });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new HttpError(404, 'Category not found.');
  await Content.updateMany({ category: category._id }, { $set: { category: null } });
  await category.deleteOne();
  await logActivity(req, { action: 'category.deleted', resourceType: 'category', resourceId: category._id, metadata: { title: category.name } });
  res.json({ success: true, message: 'Category deleted. Content was left uncategorized.' });
});

export const listTags = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) filter.name = new RegExp(escapeRegex(req.query.search), 'i');
  const tags = await Tag.find(filter).sort({ name: 1 });
  const counts = await Content.aggregate([
    { $match: { deletedAt: null } },
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json({ success: true, data: tags.map((t) => ({ ...t.toObject(), contentCount: map[String(t._id)] || 0 })) });
});

export const createTag = asyncHandler(async (req, res) => {
  if (!hasAny(req.user, ['manage_tags', 'create_content', 'edit_content', 'manage_posts'])) {
    throw new HttpError(403, 'You do not have permission to create tags.');
  }
  const name = String(req.body.name || '').trim().slice(0, 40);
  if (!name) throw new HttpError(400, 'Tag name is required.');
  const slug = await uniqueSlug(Tag, name);
  const existing = await Tag.findOne({ slug });
  if (existing) return res.json({ success: true, data: existing, message: 'Tag already exists.' });
  const tag = await Tag.create({ name, slug });
  await logActivity(req, { action: 'tag.created', resourceType: 'tag', resourceId: tag._id, metadata: { title: tag.name } });
  res.status(201).json({ success: true, data: tag, message: 'Tag created.' });
});

export const updateTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findById(req.params.id);
  if (!tag) throw new HttpError(404, 'Tag not found.');
  const name = String(req.body.name || tag.name).trim().slice(0, 40);
  if (!name) throw new HttpError(400, 'Tag name is required.');
  tag.name = name;
  tag.slug = await uniqueSlug(Tag, req.body.slug || name, tag._id);
  await tag.save();
  await logActivity(req, { action: 'tag.updated', resourceType: 'tag', resourceId: tag._id, metadata: { title: tag.name } });
  res.json({ success: true, data: tag, message: 'Tag updated.' });
});

export const deleteTag = asyncHandler(async (req, res) => {
  const tag = await Tag.findById(req.params.id);
  if (!tag) throw new HttpError(404, 'Tag not found.');
  await Content.updateMany({ tags: tag._id }, { $pull: { tags: tag._id } });
  await tag.deleteOne();
  await logActivity(req, { action: 'tag.deleted', resourceType: 'tag', resourceId: tag._id, metadata: { title: tag.name } });
  res.json({ success: true, message: 'Tag deleted.' });
});

void slugify;
