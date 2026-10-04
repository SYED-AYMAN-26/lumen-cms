import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { uploadDir, seedAssetDir } from '../config/paths.js';
import { imageSize, sanitizeSvg } from '../utils/helpers.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Tag from '../models/Tag.js';
import Media from '../models/Media.js';
import Content from '../models/Content.js';
import Page from '../models/Page.js';
import Setting from '../models/Setting.js';
import ActivityLog from '../models/ActivityLog.js';
import ContactMessage from '../models/ContactMessage.js';
import { ROLE_PRESETS } from '../config/permissions.js';
import { articles, pages } from './articles.js';

const COVERS = {
  'reading-room': { a: '#9a3412', b: '#1c1917', c: '#fdba74' },
  letterpress: { a: '#44403c', b: '#1c1917', c: '#e7e5e4' },
  gallery: { a: '#7c2d12', b: '#292524', c: '#fed7aa' },
  'studio-table': { a: '#3f3f46', b: '#18181b', c: '#d6d3d1' },
  'rain-street': { a: '#1e3a8a', b: '#0f172a', c: '#f59e0b' },
  coast: { a: '#b45309', b: '#44403c', c: '#fef3c7' },
  books: { a: '#365314', b: '#1c1917', c: '#d9f99d' },
};

function coverSvg(key, title) {
  const p = COVERS[key] || COVERS['reading-room'];
  const safe = String(title).replace(/&/g, '&amp;').replace(/</g, '&lt;').slice(0, 48);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <rect width="1600" height="1000" fill="${p.b}"/>
  <circle cx="1240" cy="240" r="210" fill="${p.a}"/>
  <circle cx="1240" cy="240" r="120" fill="none" stroke="${p.c}" stroke-width="2" opacity="0.8"/>
  <rect x="96" y="96" width="1408" height="808" fill="none" stroke="${p.c}" stroke-opacity="0.35"/>
  <rect x="96" y="760" width="220" height="8" fill="${p.c}"/>
  <text x="96" y="730" fill="${p.c}" font-family="Georgia, serif" font-size="54">${safe}</text>
  <text x="96" y="180" fill="${p.c}" font-family="Georgia, serif" font-size="18" letter-spacing="6">LUMEN</text>
</svg>`;
}

function daysAgo(days, hours = 10) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, 12, 0, 0);
  return d;
}

async function placeMedia({ key, title, userId }) {
  fs.mkdirSync(uploadDir, { recursive: true });
  const jpg = path.join(seedAssetDir, `${key}.jpg`);
  const jpeg = path.join(seedAssetDir, `${key}.jpeg`);
  const photo = fs.existsSync(jpg) ? jpg : fs.existsSync(jpeg) ? jpeg : null;
  let filename;
  let mimeType;
  let buffer;
  if (photo) {
    filename = `seed-${key}${path.extname(photo)}`;
    mimeType = 'image/jpeg';
    buffer = fs.readFileSync(photo);
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
  } else {
    filename = `seed-${key}.svg`;
    mimeType = 'image/svg+xml';
    const svg = sanitizeSvg(coverSvg(key, title));
    buffer = Buffer.from(svg);
    fs.writeFileSync(path.join(uploadDir, filename), svg);
  }
  const dim = imageSize(buffer);
  return Media.create({
    filename,
    originalName: `${key}${photo ? '.jpg' : '.svg'}`,
    url: `/uploads/${filename}`,
    mimeType,
    kind: 'image',
    size: buffer.length,
    width: dim.width,
    height: dim.height,
    altText: title,
    caption: '',
    title,
    isPublic: true,
    uploadedBy: userId,
  });
}

export async function runSeed() {
  await Promise.all([
    Role.deleteMany({}),
    User.deleteMany({}),
    Category.deleteMany({}),
    Tag.deleteMany({}),
    Media.deleteMany({}),
    Content.deleteMany({}),
    Page.deleteMany({}),
    Setting.deleteMany({}),
    ActivityLog.deleteMany({}),
    ContactMessage.deleteMany({}),
  ]);

  const roles = {};
  for (const preset of ROLE_PRESETS) {
    roles[preset.slug] = await Role.create({ ...preset, isSystem: true });
  }

  const passwords = {
    leela: 'Leela#Lumen26',
    rohan: 'Rohan#Lumen26',
    mira: 'Mira#Lumen26',
    arun: 'Arun#Lumen26',
    nila: 'Nila#Lumen26',
  };
  const hashes = Object.fromEntries(await Promise.all(Object.entries(passwords).map(async ([k, v]) => [k, await bcrypt.hash(v, 10)])));

  const people = [
    ['leela', 'Leela Raman', 'leela@lumen.cms', 'super-admin', 'Publisher. Keeps the desk honest and the permissions boring on purpose.', 1],
    ['rohan', 'Rohan Iyer', 'rohan@lumen.cms', 'admin', 'Runs users, settings, and the unglamorous half of the journal.', 2],
    ['mira', 'Mira Sen', 'mira@lumen.cms', 'editor', 'Editor. Reviews, schedules, and publishes the journal.', 0],
    ['arun', 'Arun Varghese', 'arun@lumen.cms', 'author', 'Writes about performance, media, and the print room.', 3],
    ['nila', 'Nila Joseph', 'nila@lumen.cms', 'viewer', 'Reads the desk. Does not move pieces.', 5],
  ];
  const users = {};
  for (const [key, name, email, role, bio, ago] of people) {
    users[key] = await User.create({
      name,
      email,
      password: hashes[key],
      role: roles[role]._id,
      status: 'active',
      bio,
      lastLogin: daysAgo(ago, 9),
    });
  }

  const categoryDefs = [
    ['design', 'Design', 'Type, layout, and the decisions that make a page readable.'],
    ['technology', 'Technology', 'Performance, media, and the tools behind the journal.'],
    ['craft', 'Craft', 'Workflow, print, and the practice of making.'],
    ['culture', 'Culture', 'The slower arguments: tempo, issues, and why we publish.'],
  ];
  const categories = {};
  for (const [slug, name, description] of categoryDefs) {
    categories[slug] = await Category.create({ name, slug, description });
  }

  const tags = {};
  for (const name of ['publishing', 'craft', 'typography', 'workflow', 'performance', 'accessibility', 'media']) {
    tags[name] = await Tag.create({ name, slug: name });
  }

  const media = {};
  for (const key of Object.keys(COVERS)) {
    media[key] = await placeMedia({ key, title: key.replace(/-/g, ' '), userId: users.mira._id });
  }
  for (const [slug, cat] of Object.entries(categories)) {
    const key = slug === 'design' ? 'letterpress' : slug === 'technology' ? 'rain-street' : slug === 'craft' ? 'studio-table' : 'coast';
    cat.image = media[key]._id;
    await cat.save();
  }

  const settings = await Setting.getSite();
  settings.general.siteName = 'Lumen';
  settings.general.description = 'A journal of design, technology, and making.';
  settings.general.contactEmail = 'hello@lumen.cms';
  settings.general.timezone = 'Asia/Kolkata';
  settings.content.postsPerPage = 9;
  settings.content.defaultCategory = categories.design._id;
  settings.users.registrationEnabled = false;
  settings.users.defaultRole = roles.viewer._id;
  settings.markModified('general');
  settings.markModified('content');
  settings.markModified('users');
  await settings.save();

  const youtube = [
    {
      title: 'Costa Rica in 4K',
      description: 'A public nature film, embedded as a sample. Press play — nothing autoplays.',
      embedUrl: 'https://www.youtube.com/embed/LXb3EKWsInQ',
      source: 'youtube',
      captions: 'Ambient picture with music. No spoken narration in the opening minutes.',
    },
    {
      title: 'Tears of Steel',
      description: 'Blender Foundation open movie, embedded from YouTube.',
      embedUrl: 'https://www.youtube.com/embed/aqz-KE-bpKQ',
      source: 'youtube',
      captions: 'Open movie with dialogue. Add a full caption file before a real screening.',
    },
  ];

  for (const article of articles) {
    const status = article.status === 'scheduled-soon' ? 'scheduled' : article.status === 'trash' ? 'trash' : article.status;
    const when = article.status === 'scheduled-soon' ? new Date(Date.now() + 90 * 1000) : article.status === 'scheduled' ? new Date(Date.now() + 3 * 24 * 3600 * 1000) : daysAgo(article.weeksAgo * 7, 11);
    const author = users[article.author];
    const doc = await Content.create({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      body: article.body.trim(),
      featuredImage: media[article.image]?._id || null,
      gallery: article.key === 'pictures' || article.key === 'editorial'
        ? [media.gallery._id, media.books._id, media.coast._id].filter(Boolean)
        : [],
      videos: article.videos
        ? youtube.map((v) => ({ ...v, thumbnail: media.gallery._id }))
        : [],
      author: author._id,
      category: categories[article.category]._id,
      tags: (article.tags || []).map((t) => tags[t]._id),
      type: article.type,
      status: status === 'trash' ? 'trash' : status,
      publishAt: status === 'scheduled' ? when : status === 'published' ? when : null,
      publishedAt: status === 'published' ? when : null,
      seo: {
        title: article.seoTitle || article.title,
        description: article.seoDescription || article.excerpt,
        ogTitle: article.title,
        ogDescription: article.excerpt,
      },
      reviewNote: article.reviewNote || '',
      updatedBy: author._id,
      deletedAt: status === 'trash' ? daysAgo(2, 16) : null,
      deletedBy: status === 'trash' ? users.rohan._id : null,
      revisions: status === 'published' ? [{
        title: article.title,
        excerpt: article.excerpt,
        body: '<p>Earlier lede, kept so the revision list is not empty.</p>',
        status: 'draft',
        updatedBy: author._id,
        updatedAt: daysAgo(article.weeksAgo * 7 + 1, 15),
        note: 'First draft',
      }] : [],
    });
    await Content.collection.updateOne({ _id: doc._id }, { $set: { createdAt: daysAgo(article.weeksAgo * 7, 9), updatedAt: when } });
    await ActivityLog.create({
      user: author._id,
      action: status === 'published' ? 'content.published' : 'content.created',
      resourceType: 'content',
      resourceId: doc._id,
      metadata: { title: article.title },
      ip: '127.0.0.1',
      createdAt: when,
    });
  }

  for (const page of pages) {
    const status = page.status || 'published';
    const when = daysAgo(12, 12);
    const doc = await Page.create({
      title: page.title,
      slug: page.slug,
      excerpt: page.excerpt,
      content: page.body.trim(),
      featuredImage: media[page.image]?._id || null,
      author: users.leela._id,
      status,
      publishedAt: status === 'published' ? when : null,
      seo: { title: page.title, description: page.excerpt, ogTitle: page.title, ogDescription: page.excerpt },
      updatedBy: users.leela._id,
    });
    await Page.collection.updateOne({ _id: doc._id }, { $set: { createdAt: when, updatedAt: when } });
  }

  const actions = ['auth.login', 'content.updated', 'media.uploaded', 'content.published', 'user.updated'];
  for (let i = 0; i < 14; i += 1) {
    const day = daysAgo(i, 8 + (i % 5));
    const actor = [users.leela, users.mira, users.rohan, users.arun][i % 4];
    await ActivityLog.create({
      user: actor._id,
      action: actions[i % actions.length],
      resourceType: 'content',
      metadata: { title: 'Desk activity', demo: true },
      ip: '127.0.0.1',
      createdAt: day,
    });
    if (i % 3 === 0) {
      await ActivityLog.create({
        user: users.nila._id,
        action: 'auth.login',
        resourceType: 'user',
        resourceId: users.nila._id,
        metadata: { title: users.nila.name, demo: true },
        ip: '127.0.0.1',
        createdAt: daysAgo(i, 18),
      });
    }
  }

  await ContactMessage.create({
    name: 'Anika Rao',
    email: 'anika@example.com',
    subject: 'Reprint request',
    message: 'May we excerpt the essay on editorial design for a classroom packet? Happy to link back.',
    kind: 'contact',
    read: false,
  });
  await ContactMessage.create({
    name: 'Dev Patel',
    email: 'dev@example.com',
    subject: 'Briefing',
    message: 'Please send the occasional briefing.',
    kind: 'subscribe',
    read: true,
  });

  console.log('Seeded Lumen demo data.');
  console.log('  leela@lumen.cms  /  Leela#Lumen26   Super Admin');
  console.log('  rohan@lumen.cms  /  Rohan#Lumen26   Admin');
  console.log('  mira@lumen.cms   /  Mira#Lumen26    Editor');
  console.log('  arun@lumen.cms   /  Arun#Lumen26    Author');
  console.log('  nila@lumen.cms   /  Nila#Lumen26    Viewer');
}

export async function seedIfEmpty() {
  if (process.env.SEED_ON_START === 'false') return;
  const existing = await User.countDocuments();
  if (existing > 0) {
    console.log('Database already has users — skipping seed.');
    return;
  }
  await runSeed();
}
