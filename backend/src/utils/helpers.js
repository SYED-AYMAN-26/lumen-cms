import slugifyLib from 'slugify';
import sanitizeHtml from 'sanitize-html';
import crypto from 'crypto';

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function slugify(text) {
  return slugifyLib(String(text || ''), { lower: true, strict: true, trim: true }).slice(0, 120);
}

export async function uniqueSlug(Model, base, excludeId = null) {
  const root = slugify(base) || 'untitled';
  let candidate = root;
  let n = 1;
  while (await Model.exists({ slug: candidate, _id: { $ne: excludeId } })) {
    n += 1;
    candidate = `${root}-${n}`;
  }
  return candidate;
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parsePagination(query, fallback = 12) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || fallback));
  return { page, limit, skip: (page - 1) * limit };
}

export function has(user, perm) {
  if (!user?.role) return false;
  if (user.role.slug === 'super-admin') return true;
  return Boolean(user.role.permissions?.includes(perm));
}

export function hasAny(user, perms = []) {
  return perms.some((p) => has(user, p));
}

export function canEditDoc(user, doc, anyPerms) {
  if (hasAny(user, anyPerms)) return true;
  if (has(user, 'edit_own_content') && doc.author && String(doc.author._id || doc.author) === String(user._id)) {
    return true;
  }
  return false;
}

export function textFromHtml(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeContent(html) {
  return sanitizeHtml(html || '', {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'p', 'br', 'hr', 'blockquote', 'ul', 'ol', 'li',
      'strong', 'b', 'em', 'i', 'u', 's', 'a', 'img', 'figure', 'figcaption',
      'pre', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div',
      'iframe', 'video', 'source',
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      iframe: ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder', 'title'],
      video: ['src', 'controls', 'poster', 'width', 'height', 'preload'],
      source: ['src', 'type'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
      '*': ['class', 'style'],
    },
    allowedStyles: {
      '*': {
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
      },
    },
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'player.vimeo.com'],
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https'],
      video: ['http', 'https'],
      source: ['http', 'https'],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName: 'a',
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer',
          target: attribs.target || '_blank',
        },
      }),
    },
  });
}

export function sanitizeSvg(text) {
  return String(text)
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '');
}

export function toEmbedUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (raw.startsWith('/uploads/')) return raw;
  const yt = raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return '';
}

export function sanitizeVideos(videos) {
  if (!Array.isArray(videos)) return [];
  return videos.slice(0, 12).map((v) => {
    const embedUrl = toEmbedUrl(v.embedUrl) || (String(v.embedUrl || '').startsWith('/uploads/') ? v.embedUrl : '');
    let source = ['upload', 'youtube', 'vimeo', 'external'].includes(v.source) ? v.source : 'external';
    if (embedUrl.includes('youtube.com')) source = 'youtube';
    if (embedUrl.includes('vimeo.com')) source = 'vimeo';
    if (String(v.media || '') && source === 'external') source = 'upload';
    return {
      title: String(v.title || '').slice(0, 160),
      description: String(v.description || '').slice(0, 600),
      embedUrl,
      media: v.media || null,
      thumbnail: v.thumbnail || null,
      captions: String(v.captions || '').slice(0, 2000),
      source,
    };
  }).filter((v) => v.embedUrl || v.media);
}

export function validatePassword(password, security = {}) {
  const min = security.minPasswordLength || 8;
  if (!password || password.length < min) return `Password must be at least ${min} characters.`;
  if (security.requireUppercase && !/[A-Z]/.test(password)) return 'Password must include an uppercase letter.';
  if (security.requireNumber && !/\d/.test(password)) return 'Password must include a number.';
  if (security.requireSymbol && !/[^A-Za-z0-9]/.test(password)) return 'Password must include a symbol.';
  return null;
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function imageSize(buffer) {
  if (!buffer || buffer.length < 24) return { width: null, height: null };
  if (buffer[0] === 0x89 && buffer[1] === 0x50) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let i = 2;
    while (i < buffer.length - 8) {
      if (buffer[i] !== 0xff) break;
      const marker = buffer[i + 1];
      const len = buffer.readUInt16BE(i + 2);
      if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
        return { height: buffer.readUInt16BE(i + 5), width: buffer.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X' && buffer.length >= 30) {
      return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    }
  }
  const head = buffer.toString('utf8', 0, 400);
  if (head.includes('<svg')) {
    const text = buffer.toString('utf8');
    const w = text.match(/\bwidth=["'](\d+(?:\.\d+)?)/);
    const h = text.match(/\bheight=["'](\d+(?:\.\d+)?)/);
    if (w && h) return { width: Math.round(Number(w[1])), height: Math.round(Number(h[1])) };
    const vb = text.match(/viewBox=["']\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/);
    if (vb) return { width: Math.round(Number(vb[1])), height: Math.round(Number(vb[2])) };
  }
  return { width: null, height: null };
}

export const RESERVED_PAGE_SLUGS = new Set([
  'blog', 'category', 'search', 'gallery', 'videos', 'contact', 'admin', 'login',
  'preview', 'api', 'p', 'register', 'forgot-password', 'reset-password', 'uploads', 'assets',
]);

export function publicUser(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.resetTokenHash;
  delete obj.resetTokenExp;
  delete obj.tokenVersion;
  delete obj.__v;
  return obj;
}
