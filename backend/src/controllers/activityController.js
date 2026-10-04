import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import ContactMessage from '../models/ContactMessage.js';
import { asyncHandler, HttpError, parsePagination, escapeRegex } from '../utils/helpers.js';
import { logActivity } from '../services/activity.js';

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 20);
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.user) filter.user = req.query.user;
  if (req.query.resourceType) filter.resourceType = req.query.resourceType;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id');
    filter.$or = [
      { action: rx },
      { resourceType: rx },
      { 'metadata.title': rx },
      { user: { $in: users.map((u) => u._id) } },
    ];
  }
  const [items, total] = await Promise.all([
    ActivityLog.find(filter).populate('user', 'name email avatar').sort({ createdAt: -1 }).skip(skip).limit(limit),
    ActivityLog.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const listMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 20);
  const filter = {};
  if (req.query.kind) filter.kind = req.query.kind;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { subject: rx }, { message: rx }];
  }
  const [items, total, unread] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ContactMessage.countDocuments(filter),
    ContactMessage.countDocuments({ read: false, kind: 'contact' }),
  ]);
  res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)), unread } });
});

export const markMessage = asyncHandler(async (req, res) => {
  const msg = await ContactMessage.findById(req.params.id);
  if (!msg) throw new HttpError(404, 'Message not found.');
  msg.read = req.body.read !== false;
  await msg.save();
  res.json({ success: true, data: msg });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const msg = await ContactMessage.findById(req.params.id);
  if (!msg) throw new HttpError(404, 'Message not found.');
  await msg.deleteOne();
  await logActivity(req, { action: 'contact.deleted', resourceType: 'contact', resourceId: msg._id, metadata: { title: msg.subject || msg.email } });
  res.json({ success: true, message: 'Message deleted.' });
});
