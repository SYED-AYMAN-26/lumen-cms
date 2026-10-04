import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Role from '../models/Role.js';
import Setting from '../models/Setting.js';
import { asyncHandler, HttpError, validatePassword, hashToken, publicUser } from '../utils/helpers.js';
import { logActivity } from '../services/activity.js';

function signToken(user, remember, settings) {
  const hours = settings?.security?.tokenExpiryHours || 12;
  const days = settings?.security?.rememberExpiryDays || 30;
  const expiresIn = remember ? `${days}d` : `${hours}h`;
  return jwt.sign({ id: user._id.toString(), tv: user.tokenVersion || 0 }, process.env.JWT_SECRET, { expiresIn });
}

export const config = asyncHandler(async (_req, res) => {
  const settings = await Setting.getSite();
  res.json({
    success: true,
    data: {
      siteName: settings.general.siteName,
      description: settings.general.description,
      registrationEnabled: settings.users.registrationEnabled,
      passwordPolicy: settings.security,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const password = String(req.body.password || '');
  if (!email || !password) throw new HttpError(400, 'Email and password are required.');

  const user = await User.findOne({ email }).select('+password +tokenVersion').populate('role');
  if (!user) throw new HttpError(401, 'Email or password is incorrect.');
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new HttpError(401, 'Email or password is incorrect.');
  if (user.status === 'suspended') throw new HttpError(403, 'This account has been suspended. Contact an administrator.');
  if (user.status === 'inactive') throw new HttpError(403, 'This account is inactive. Contact an administrator.');

  user.lastLogin = new Date();
  await user.save();
  const settings = await Setting.getSite();
  const token = signToken(user, Boolean(req.body.remember), settings);
  await logActivity(req, { action: 'auth.login', resourceType: 'user', resourceId: user._id, metadata: { title: user.name }, userId: user._id });
  res.json({ success: true, data: { token, user: publicUser(user) }, message: 'Signed in.' });
});

export const register = asyncHandler(async (req, res) => {
  const settings = await Setting.getSite();
  if (!settings.users.registrationEnabled) throw new HttpError(403, 'Registration is closed.');
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').toLowerCase().trim();
  const password = String(req.body.password || '');
  if (!name || !email || !password) throw new HttpError(400, 'Name, email, and password are required.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  const policyError = validatePassword(password, settings.security);
  if (policyError) throw new HttpError(400, policyError);
  const exists = await User.findOne({ email });
  if (exists) throw new HttpError(409, 'An account with that email already exists.');
  const role = settings.users.defaultRole || await Role.findOne({ slug: 'viewer' });
  if (!role) throw new HttpError(500, 'Default role is not configured.');
  const user = await User.create({
    name: name.slice(0, 80),
    email,
    password: await bcrypt.hash(password, 10),
    role: role._id || role,
    status: 'active',
  });
  await user.populate('role');
  await logActivity(req, { action: 'auth.register', resourceType: 'user', resourceId: user._id, metadata: { title: user.name }, userId: user._id });
  const token = signToken(user, false, settings);
  res.status(201).json({ success: true, data: { token, user: publicUser(user) }, message: 'Account created.' });
});

export const logout = asyncHandler(async (req, res) => {
  req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
  await req.user.save();
  await logActivity(req, { action: 'auth.logout', resourceType: 'user', resourceId: req.user._id, metadata: { title: req.user.name } });
  res.json({ success: true, message: 'Signed out.' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('role');
  res.json({ success: true, data: publicUser(user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.name !== undefined) user.name = String(req.body.name).trim().slice(0, 80);
  if (req.body.bio !== undefined) user.bio = String(req.body.bio).slice(0, 400);
  if (req.body.avatar !== undefined) user.avatar = String(req.body.avatar || '').slice(0, 400);
  if (req.body.email !== undefined) {
    const email = String(req.body.email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
    const clash = await User.findOne({ email, _id: { $ne: user._id } });
    if (clash) throw new HttpError(409, 'That email is already in use.');
    user.email = email;
  }
  if (!user.name) throw new HttpError(400, 'Name is required.');
  await user.save();
  await user.populate('role');
  await logActivity(req, { action: 'user.updated', resourceType: 'user', resourceId: user._id, metadata: { title: user.name, self: true } });
  res.json({ success: true, data: publicUser(user), message: 'Profile updated.' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const settings = await Setting.getSite();
  const user = await User.findById(req.user._id).select('+password +tokenVersion');
  const ok = await bcrypt.compare(String(req.body.currentPassword || ''), user.password);
  if (!ok) throw new HttpError(400, 'Current password is incorrect.');
  const policyError = validatePassword(req.body.newPassword, settings.security);
  if (policyError) throw new HttpError(400, policyError);
  user.password = await bcrypt.hash(req.body.newPassword, 10);
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  const token = signToken(user, true, settings);
  await logActivity(req, { action: 'auth.password_reset', resourceType: 'user', resourceId: user._id, metadata: { title: user.name, self: true } });
  res.json({ success: true, data: { token }, message: 'Password updated. Other sessions were signed out.' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const generic = 'If an account exists for that email, a reset link has been created.';
  if (!email) throw new HttpError(400, 'Email is required.');
  const user = await User.findOne({ email }).select('+resetTokenHash +resetTokenExp');
  if (!user || user.status !== 'active') {
    return res.json({ success: true, message: generic });
  }
  const raw = crypto.randomBytes(32).toString('hex');
  user.resetTokenHash = hashToken(raw);
  user.resetTokenExp = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();
  await logActivity(req, { action: 'auth.password_reset', resourceType: 'user', resourceId: user._id, metadata: { title: user.name, requested: true }, userId: user._id });
  const payload = { success: true, message: generic };
  if (process.env.DEMO_EXPOSE_RESET === 'true') {
    payload.data = { resetUrl: `/reset-password?token=${raw}`, demoOnly: true };
    payload.message = 'Demo mode: email is not configured. Use the reset link below. It expires in 30 minutes.';
  }
  res.json(payload);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  if (!token) throw new HttpError(400, 'Reset token is missing.');
  const settings = await Setting.getSite();
  const policyError = validatePassword(password, settings.security);
  if (policyError) throw new HttpError(400, policyError);
  const user = await User.findOne({
    resetTokenHash: hashToken(token),
    resetTokenExp: { $gt: new Date() },
  }).select('+resetTokenHash +resetTokenExp +tokenVersion');
  if (!user) throw new HttpError(400, 'This reset link is invalid or has expired.');
  user.password = await bcrypt.hash(password, 10);
  user.resetTokenHash = undefined;
  user.resetTokenExp = undefined;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
  await logActivity(req, { action: 'auth.password_reset', resourceType: 'user', resourceId: user._id, metadata: { title: user.name, completed: true }, userId: user._id });
  res.json({ success: true, message: 'Password reset. You can sign in now.' });
});
