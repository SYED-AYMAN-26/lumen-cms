import Role from '../models/Role.js';
import User from '../models/User.js';
import { PERMISSIONS, PERMISSION_KEYS } from '../config/permissions.js';
import { asyncHandler, HttpError, slugify } from '../utils/helpers.js';
import { logActivity } from '../services/activity.js';

export const catalog = asyncHandler(async (_req, res) => {
  const roles = await Role.find().sort({ createdAt: 1 });
  res.json({ success: true, data: { permissions: PERMISSIONS, roles } });
});

export const list = asyncHandler(async (_req, res) => {
  const roles = await Role.find().sort({ createdAt: 1 });
  const counts = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json({
    success: true,
    data: roles.map((r) => ({ ...r.toObject(), userCount: map[String(r._id)] || 0 })),
  });
});

export const create = asyncHandler(async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) throw new HttpError(400, 'Role name is required.');
  const slug = slugify(req.body.slug || name);
  if (!slug) throw new HttpError(400, 'Role name needs letters or numbers.');
  const permissions = (req.body.permissions || []).filter((p) => PERMISSION_KEYS.includes(p));
  const role = await Role.create({
    name: name.slice(0, 60),
    slug,
    description: String(req.body.description || '').slice(0, 300),
    permissions,
    isSystem: false,
  });
  await logActivity(req, { action: 'role.created', resourceType: 'role', resourceId: role._id, metadata: { title: role.name } });
  res.status(201).json({ success: true, data: role, message: 'Role created.' });
});

export const update = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new HttpError(404, 'Role not found.');
  if (role.slug === 'super-admin' && req.user.role.slug !== 'super-admin') {
    throw new HttpError(403, 'Only a super admin can edit the super admin role.');
  }
  if (req.body.name && role.slug !== 'super-admin') role.name = String(req.body.name).trim().slice(0, 60);
  if (req.body.description !== undefined) role.description = String(req.body.description).slice(0, 300);
  if (req.body.permissions) {
    if (role.slug === 'super-admin') {
      role.permissions = PERMISSION_KEYS;
    } else {
      role.permissions = req.body.permissions.filter((p) => PERMISSION_KEYS.includes(p));
    }
  }
  await role.save();
  await logActivity(req, { action: 'role.updated', resourceType: 'role', resourceId: role._id, metadata: { title: role.name } });
  res.json({ success: true, data: role, message: role.slug === 'super-admin' ? 'Super admin always retains every permission.' : 'Role updated.' });
});

export const remove = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) throw new HttpError(404, 'Role not found.');
  if (role.isSystem) throw new HttpError(400, 'System roles cannot be deleted. Remove their permissions instead, or create a custom role.');
  const users = await User.countDocuments({ role: role._id });
  if (users) throw new HttpError(400, 'Reassign users before deleting this role.');
  await role.deleteOne();
  await logActivity(req, { action: 'role.deleted', resourceType: 'role', resourceId: role._id, metadata: { title: role.name } });
  res.json({ success: true, message: 'Role deleted.' });
});
