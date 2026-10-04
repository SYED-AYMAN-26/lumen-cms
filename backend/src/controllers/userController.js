import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Setting from '../models/Setting.js';
import { asyncHandler, HttpError, parsePagination, escapeRegex, validatePassword, publicUser, has } from '../utils/helpers.js';
import { logActivity } from '../services/activity.js';

async function assertCanTouch(actor, target) {
  const role = target.role?.slug ? target.role : await Role.findById(target.role);
  if (role?.slug === 'super-admin' && actor.role?.slug !== 'super-admin') {
    throw new HttpError(403, 'Only a super admin can change another super admin.');
  }
}

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 12);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).populate('role').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: items.map(publicUser), meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const getOne = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('role');
  if (!user) throw new HttpError(404, 'User not found.');
  res.json({ success: true, data: publicUser(user) });
});

export const create = asyncHandler(async (req, res) => {
  const settings = await Setting.getSite();
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').toLowerCase().trim();
  const password = String(req.body.password || '');
  if (!name || !email || !password) throw new HttpError(400, 'Name, email, and password are required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  const policyError = validatePassword(password, settings.security);
  if (policyError) throw new HttpError(400, policyError);
  const role = await Role.findById(req.body.role);
  if (!role) throw new HttpError(400, 'Choose a valid role.');
  if (role.slug === 'super-admin' && req.user.role.slug !== 'super-admin') {
    throw new HttpError(403, 'Only a super admin can create another super admin.');
  }
  const status = ['active', 'inactive', 'suspended'].includes(req.body.status) ? req.body.status : 'active';
  const user = await User.create({
    name: name.slice(0, 80),
    email,
    password: await bcrypt.hash(password, 10),
    role: role._id,
    status,
    bio: String(req.body.bio || '').slice(0, 400),
    avatar: String(req.body.avatar || '').slice(0, 400),
  });
  await user.populate('role');
  await logActivity(req, { action: 'user.created', resourceType: 'user', resourceId: user._id, metadata: { title: user.name } });
  res.status(201).json({ success: true, data: publicUser(user), message: 'User created.' });
});

export const update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('role');
  if (!user) throw new HttpError(404, 'User not found.');
  await assertCanTouch(req.user, user);
  if (req.body.name !== undefined) user.name = String(req.body.name).trim().slice(0, 80);
  if (req.body.bio !== undefined) user.bio = String(req.body.bio).slice(0, 400);
  if (req.body.avatar !== undefined) user.avatar = String(req.body.avatar || '').slice(0, 400);
  if (req.body.email !== undefined) {
    const email = String(req.body.email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
    user.email = email;
  }
  if (req.body.status) {
    if (!['active', 'inactive', 'suspended'].includes(req.body.status)) throw new HttpError(400, 'Invalid status.');
    if (String(user._id) === String(req.user._id) && req.body.status !== 'active') {
      throw new HttpError(400, 'You cannot deactivate your own account.');
    }
    user.status = req.body.status;
  }
  if (req.body.role) {
    const role = await Role.findById(req.body.role);
    if (!role) throw new HttpError(400, 'Role not found.');
    if (role.slug === 'super-admin' && req.user.role.slug !== 'super-admin') {
      throw new HttpError(403, 'Only a super admin can assign the super admin role.');
    }
    if (user.role?.slug === 'super-admin' && role.slug !== 'super-admin') {
      const remaining = await User.countDocuments({ role: user.role._id, status: 'active', _id: { $ne: user._id } });
      if (remaining < 1) throw new HttpError(400, 'There must be at least one active super admin.');
    }
    const previous = user.role?.name;
    user.role = role._id;
    if (previous && previous !== role.name) {
      await logActivity(req, { action: 'user.role_changed', resourceType: 'user', resourceId: user._id, metadata: { title: user.name, from: previous, to: role.name } });
    }
  }
  if (!user.name) throw new HttpError(400, 'Name is required.');
  await user.save();
  await user.populate('role');
  await logActivity(req, { action: 'user.updated', resourceType: 'user', resourceId: user._id, metadata: { title: user.name } });
  res.json({ success: true, data: publicUser(user), message: 'User updated.' });
});

export const deactivate = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('role');
  if (!user) throw new HttpError(404, 'User not found.');
  if (String(user._id) === String(req.user._id)) throw new HttpError(400, 'You cannot deactivate your own account.');
  await assertCanTouch(req.user, user);
  user.status = 'inactive';
  await user.save();
  await logActivity(req, { action: 'user.deactivated', resourceType: 'user', resourceId: user._id, metadata: { title: user.name } });
  res.json({ success: true, data: publicUser(user), message: 'User deactivated.' });
});

export const destroy = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('role');
  if (!user) throw new HttpError(404, 'User not found.');
  if (String(user._id) === String(req.user._id)) throw new HttpError(400, 'You cannot delete your own account.');
  await assertCanTouch(req.user, user);
  if (user.role?.slug === 'super-admin') throw new HttpError(400, 'Super admin accounts cannot be deleted. Deactivate them instead.');
  await user.deleteOne();
  await logActivity(req, { action: 'user.deleted', resourceType: 'user', resourceId: user._id, metadata: { title: user.name } });
  res.json({ success: true, message: 'User permanently deleted.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const settings = await Setting.getSite();
  const user = await User.findById(req.params.id).select('+tokenVersion').populate('role');
  if (!user) throw new HttpError(404, 'User not found.');
  await assertCanTouch(req.user, user);
  const policyError = validatePassword(req.body.password, settings.security);
  if (policyError) throw new HttpError(400, policyError);
  user.password = await bcrypt.hash(req.body.password, 10);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  await logActivity(req, { action: 'user.password_reset', resourceType: 'user', resourceId: user._id, metadata: { title: user.name } });
  res.json({ success: true, message: 'Password reset. Existing sessions for that user were signed out.' });
});

export const canManage = has;
