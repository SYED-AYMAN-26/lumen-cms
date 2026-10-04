import fs from 'fs';
import path from 'path';
import Media from '../models/Media.js';
import Setting from '../models/Setting.js';
import { storage } from '../services/storage.js';
import { asyncHandler, HttpError, parsePagination, escapeRegex, imageSize, sanitizeSvg, hasAny } from '../utils/helpers.js';
import { logActivity } from '../services/activity.js';

const MIME = {
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  png: ['image/png'],
  webp: ['image/webp'],
  svg: ['image/svg+xml', 'text/xml', 'application/xml', 'text/plain', 'application/octet-stream'],
  mp4: ['video/mp4'],
  webm: ['video/webm'],
};

function unlink(file) {
  if (file?.path) fs.unlink(file.path, () => {});
}

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query, 24);
  const filter = {};
  if (req.query.kind) filter.kind = req.query.kind;
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [{ originalName: rx }, { title: rx }, { altText: rx }, { filename: rx }];
  }
  const [items, total] = await Promise.all([
    Media.find(filter).populate('uploadedBy', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Media.countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
});

export const uploadFiles = asyncHandler(async (req, res) => {
  if (!hasAny(req.user, ['upload_media', 'manage_media'])) {
    (req.files || []).forEach(unlink);
    throw new HttpError(403, 'You do not have permission to upload media.');
  }
  const files = req.files || [];
  if (!files.length) throw new HttpError(400, 'Choose at least one file.');
  const settings = await Setting.getSite();
  const max = (settings.media.maxUploadMb || 25) * 1024 * 1024;
  const imageExt = new Set((settings.media.allowedImageTypes || []).map((x) => x.toLowerCase()));
  const videoExt = new Set((settings.media.allowedVideoTypes || []).map((x) => x.toLowerCase()));
  const created = [];

  for (const file of files) {
    const ext = path.extname(file.originalname || file.filename).toLowerCase().replace('.', '');
    const allowedMimes = MIME[ext] || [];
    const isImage = imageExt.has(ext);
    const isVideo = videoExt.has(ext);
    if ((!isImage && !isVideo) || (file.mimetype && allowedMimes.length && !allowedMimes.includes(file.mimetype))) {
      unlink(file);
      throw new HttpError(400, `“${file.originalname}” is not an allowed file type.`);
    }
    if (file.size > max) {
      unlink(file);
      throw new HttpError(400, `“${file.originalname}” exceeds the ${settings.media.maxUploadMb} MB upload limit.`);
    }
    if (ext === 'svg') {
      const raw = fs.readFileSync(file.path, 'utf8');
      if (/<script|onload=|javascript:/i.test(raw)) {
        const cleaned = sanitizeSvg(raw);
        fs.writeFileSync(file.path, cleaned);
      }
    }
    const buf = ext === 'mp4' || ext === 'webm' ? null : fs.readFileSync(file.path);
    const dim = buf ? imageSize(buf) : { width: null, height: null };
    const doc = await Media.create({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
      kind: isVideo ? 'video' : 'image',
      size: file.size,
      width: dim.width,
      height: dim.height,
      title: path.parse(file.originalname).name.slice(0, 160),
      uploadedBy: req.user._id,
    });
    created.push(doc);
    await logActivity(req, { action: 'media.uploaded', resourceType: 'media', resourceId: doc._id, metadata: { title: doc.originalName } });
  }

  res.status(201).json({ success: true, data: created, message: created.length === 1 ? 'File uploaded.' : `${created.length} files uploaded.` });
});

export const update = asyncHandler(async (req, res) => {
  if (!hasAny(req.user, ['manage_media', 'upload_media'])) {
    throw new HttpError(403, 'You do not have permission to edit media.');
  }
  const media = await Media.findById(req.params.id);
  if (!media) throw new HttpError(404, 'File not found.');
  if (req.body.altText !== undefined) media.altText = String(req.body.altText).slice(0, 200);
  if (req.body.caption !== undefined) media.caption = String(req.body.caption).slice(0, 300);
  if (req.body.title !== undefined) media.title = String(req.body.title).slice(0, 160);
  if (req.body.isPublic !== undefined) media.isPublic = Boolean(req.body.isPublic);
  await media.save();
  await logActivity(req, { action: 'media.updated', resourceType: 'media', resourceId: media._id, metadata: { title: media.title || media.originalName } });
  res.json({ success: true, data: media, message: 'Media details saved.' });
});

export const remove = asyncHandler(async (req, res) => {
  if (!hasAny(req.user, ['delete_media', 'manage_media'])) {
    throw new HttpError(403, 'You do not have permission to delete media.');
  }
  const media = await Media.findById(req.params.id);
  if (!media) throw new HttpError(404, 'File not found.');
  storage.remove(media.filename);
  await media.deleteOne();
  await logActivity(req, { action: 'media.deleted', resourceType: 'media', resourceId: media._id, metadata: { title: media.originalName } });
  res.json({ success: true, message: 'File deleted.' });
});
