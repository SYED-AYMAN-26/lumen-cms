import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadDir } from '../config/paths.js';

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase().slice(0, 8);
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.mp4', '.webm'].includes(ext) ? ext : '';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 80 * 1024 * 1024, files: 12 },
});
