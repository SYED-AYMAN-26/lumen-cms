import Content from '../models/Content.js';
import Page from '../models/Page.js';
import User from '../models/User.js';
import Media from '../models/Media.js';
import Category from '../models/Category.js';
import { asyncHandler, escapeRegex, hasAny } from '../utils/helpers.js';

export const search = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ success: true, data: { content: [], pages: [], users: [], media: [], categories: [] } });
  const rx = new RegExp(escapeRegex(q), 'i');
  const tasks = [
    Content.find({ deletedAt: null, $or: [{ title: rx }, { excerpt: rx }, { slug: rx }] }).select('title slug status type').limit(6),
    Page.find({ deletedAt: null, $or: [{ title: rx }, { slug: rx }] }).select('title slug status').limit(5),
    Category.find({ $or: [{ name: rx }, { slug: rx }] }).select('name slug').limit(5),
  ];
  if (hasAny(req.user, ['manage_media', 'upload_media', 'view_content'])) {
    tasks.push(Media.find({ $or: [{ originalName: rx }, { title: rx }, { altText: rx }] }).select('title originalName url kind').limit(5));
  } else tasks.push(Promise.resolve([]));
  if (hasAny(req.user, ['manage_users'])) {
    tasks.push(User.find({ $or: [{ name: rx }, { email: rx }] }).select('name email status').limit(5));
  } else tasks.push(Promise.resolve([]));
  const [content, pages, categories, media, users] = await Promise.all(tasks);
  res.json({ success: true, data: { content, pages, categories, media, users } });
});
