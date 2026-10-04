import Setting from '../models/Setting.js';
import { asyncHandler } from '../utils/helpers.js';
import { logActivity } from '../services/activity.js';

function assign(target, source, keys) {
  if (!source) return;
  for (const key of keys) {
    if (source[key] !== undefined) target[key] = source[key];
  }
}

export const getSettings = asyncHandler(async (_req, res) => {
  const settings = await Setting.getSite();
  await settings.populate(['general.logo', 'general.favicon', 'content.defaultCategory', 'users.defaultRole']);
  res.json({ success: true, data: settings });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Setting.getSite();
  assign(settings.general, req.body.general, ['siteName', 'description', 'logo', 'favicon', 'contactEmail', 'timezone']);
  assign(settings.content, req.body.content, ['postsPerPage', 'defaultCategory']);
  assign(settings.users, req.body.users, ['registrationEnabled', 'defaultRole']);
  assign(settings.media, req.body.media, ['maxUploadMb', 'allowedImageTypes', 'allowedVideoTypes']);
  assign(settings.security, req.body.security, [
    'minPasswordLength', 'requireUppercase', 'requireNumber', 'requireSymbol', 'tokenExpiryHours', 'rememberExpiryDays',
  ]);
  if (settings.content.postsPerPage) {
    settings.content.postsPerPage = Math.min(48, Math.max(3, Number(settings.content.postsPerPage) || 9));
  }
  if (settings.media.maxUploadMb) {
    settings.media.maxUploadMb = Math.min(80, Math.max(1, Number(settings.media.maxUploadMb) || 25));
  }
  if (settings.security.minPasswordLength) {
    settings.security.minPasswordLength = Math.min(64, Math.max(8, Number(settings.security.minPasswordLength) || 8));
  }
  settings.markModified('general');
  settings.markModified('content');
  settings.markModified('users');
  settings.markModified('media');
  settings.markModified('security');
  await settings.save();
  await logActivity(req, { action: 'settings.updated', resourceType: 'settings', metadata: { title: 'Site settings' } });
  res.json({ success: true, data: settings, message: 'Settings saved.' });
});
