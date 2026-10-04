import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const backendRoot = path.resolve(here, '../..');
export const uploadDir = path.resolve(backendRoot, process.env.UPLOAD_DIR || 'uploads');
export const seedAssetDir = path.resolve(backendRoot, 'seed-assets');
