import fs from 'fs';
import path from 'path';
import { uploadDir } from '../config/paths.js';

/**
 * Local disk storage. Replace this module to move media to S3 or another bucket
 * without changing controllers: keep save/remove/urlFor behavior the same.
 */
export const storage = {
  root: uploadDir,
  urlFor(filename) {
    return `/uploads/${filename}`;
  },
  absolute(filename) {
    return path.join(uploadDir, filename);
  },
  ensure() {
    fs.mkdirSync(uploadDir, { recursive: true });
  },
  write(filename, buffer) {
    this.ensure();
    fs.writeFileSync(this.absolute(filename), buffer);
    return { filename, url: this.urlFor(filename), size: buffer.length };
  },
  remove(filename) {
    if (!filename) return;
    const full = this.absolute(filename);
    if (!full.startsWith(uploadDir)) return;
    fs.unlink(full, () => {});
  },
};
