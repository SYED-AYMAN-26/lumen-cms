import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, requirePermission } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as auth from '../controllers/authController.js';
import * as users from '../controllers/userController.js';
import * as roles from '../controllers/roleController.js';
import * as tax from '../controllers/taxonomyController.js';
import * as media from '../controllers/mediaController.js';
import * as settings from '../controllers/settingController.js';
import * as activity from '../controllers/activityController.js';
import * as dashboard from '../controllers/dashboardController.js';
import * as search from '../controllers/searchController.js';
import * as pub from '../controllers/publicController.js';
import { createPublishingController } from '../controllers/resourceController.js';
import Content from '../models/Content.js';
import Page from '../models/Page.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Try again in a few minutes.' },
});
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages. Please try again later.' },
});

const contentPop = [
  { path: 'author', select: 'name email avatar' },
  { path: 'category', select: 'name slug' },
  { path: 'tags', select: 'name slug' },
  { path: 'featuredImage' },
  { path: 'gallery' },
  { path: 'videos.media' },
  { path: 'videos.thumbnail' },
  { path: 'seo.ogImage' },
  { path: 'updatedBy', select: 'name' },
];
const contentListPop = [
  { path: 'author', select: 'name' },
  { path: 'category', select: 'name slug' },
  { path: 'featuredImage', select: 'url altText' },
];
const pagePop = [
  { path: 'author', select: 'name email' },
  { path: 'featuredImage' },
  { path: 'seo.ogImage' },
  { path: 'updatedBy', select: 'name' },
];

const content = createPublishingController({
  Model: Content,
  resourceType: 'content',
  bodyKey: 'body',
  listPopulate: contentListPop,
  detailPopulate: contentPop,
  createPerms: ['create_content', 'manage_posts'],
  editAnyPerms: ['edit_content', 'manage_posts'],
  deletePerms: ['delete_content', 'manage_posts'],
  publishPerms: ['publish_content', 'manage_posts'],
  reviewPerms: ['review_content', 'publish_content', 'manage_posts'],
});

const pages = createPublishingController({
  Model: Page,
  resourceType: 'page',
  bodyKey: 'content',
  listPopulate: pagePop,
  detailPopulate: pagePop,
  createPerms: ['manage_pages'],
  editAnyPerms: ['manage_pages', 'edit_content'],
  deletePerms: ['manage_pages', 'delete_content'],
  publishPerms: ['manage_pages', 'publish_content'],
  reviewPerms: ['manage_pages', 'review_content'],
});

function mountResource(path, ctrl, viewPerms) {
  const r = Router();
  r.use(protect);
  r.get('/', requirePermission(...viewPerms), ctrl.list);
  r.post('/', ctrl.create);
  r.get('/:id/revisions', requirePermission(...viewPerms), ctrl.revisions);
  r.post('/:id/revisions/:revId/restore', ctrl.restoreRevision);
  r.get('/:id', requirePermission(...viewPerms), ctrl.getOne);
  r.put('/:id', ctrl.update);
  r.delete('/:id/permanent', ctrl.destroy);
  r.delete('/:id', ctrl.remove);
  r.post('/:id/publish', ctrl.publish);
  r.post('/:id/unpublish', ctrl.unpublish);
  r.post('/:id/submit', ctrl.submit);
  r.post('/:id/approve', ctrl.approve);
  r.post('/:id/reject', ctrl.reject);
  r.post('/:id/schedule', ctrl.schedule);
  r.post('/:id/archive', ctrl.archive);
  r.post('/:id/restore', ctrl.restore);
  r.post('/:id/duplicate', ctrl.duplicate);
  router.use(path, r);
}

router.post('/auth/login', loginLimiter, auth.login);
router.post('/auth/register', loginLimiter, auth.register);
router.post('/auth/logout', protect, auth.logout);
router.get('/auth/me', protect, auth.me);
router.get('/auth/config', auth.config);
router.put('/auth/profile', protect, auth.updateProfile);
router.put('/auth/password', protect, auth.changePassword);
router.post('/auth/forgot-password', loginLimiter, auth.forgotPassword);
router.post('/auth/reset-password', loginLimiter, auth.resetPassword);

router.use('/users', protect, requirePermission('manage_users'));
router.get('/users', users.list);
router.post('/users', users.create);
router.get('/users/:id', users.getOne);
router.put('/users/:id', users.update);
router.delete('/users/:id/permanent', users.destroy);
router.delete('/users/:id', users.deactivate);
router.post('/users/:id/reset-password', users.resetPassword);

router.get('/permissions', protect, requirePermission('manage_roles'), roles.catalog);
router.get('/roles', protect, requirePermission('manage_roles', 'manage_users'), roles.list);
router.post('/roles', protect, requirePermission('manage_roles'), roles.create);
router.put('/roles/:id', protect, requirePermission('manage_roles'), roles.update);
router.delete('/roles/:id', protect, requirePermission('manage_roles'), roles.remove);

mountResource('/content', content, ['view_content', 'create_content', 'edit_own_content', 'manage_posts']);
mountResource('/pages', pages, ['view_content', 'manage_pages']);

router.get('/categories', protect, requirePermission('view_content', 'manage_categories', 'create_content'), tax.listCategories);
router.post('/categories', protect, requirePermission('manage_categories'), tax.createCategory);
router.put('/categories/:id', protect, requirePermission('manage_categories'), tax.updateCategory);
router.delete('/categories/:id', protect, requirePermission('manage_categories'), tax.deleteCategory);

router.get('/tags', protect, requirePermission('view_content', 'manage_tags', 'create_content'), tax.listTags);
router.post('/tags', protect, tax.createTag);
router.put('/tags/:id', protect, requirePermission('manage_tags'), tax.updateTag);
router.delete('/tags/:id', protect, requirePermission('manage_tags'), tax.deleteTag);

router.get('/media', protect, requirePermission('view_content', 'manage_media', 'upload_media'), media.list);
router.post('/media/upload', protect, (req, res, next) => {
  upload.array('files', 12)(req, res, (err) => {
    if (err) return next(err);
    next();
  });
}, media.uploadFiles);
router.put('/media/:id', protect, media.update);
router.delete('/media/:id', protect, media.remove);

router.get('/activity', protect, requirePermission('view_activity_logs'), activity.list);
router.get('/messages', protect, requirePermission('manage_settings'), activity.listMessages);
router.patch('/messages/:id', protect, requirePermission('manage_settings'), activity.markMessage);
router.delete('/messages/:id', protect, requirePermission('manage_settings'), activity.deleteMessage);

router.get('/settings', protect, requirePermission('manage_settings'), settings.getSettings);
router.put('/settings', protect, requirePermission('manage_settings'), settings.updateSettings);
router.get('/dashboard', protect, requirePermission('view_dashboard'), dashboard.stats);
router.get('/search', protect, requirePermission('view_dashboard', 'view_content'), search.search);

router.get('/public/bootstrap', pub.bootstrap);
router.get('/public/home', pub.home);
router.get('/public/posts', pub.posts);
router.get('/public/posts/:slug', pub.postBySlug);
router.get('/public/pages/:slug', pub.pageBySlug);
router.get('/public/gallery', pub.gallery);
router.get('/public/videos', pub.videos);
router.get('/public/search', pub.search);
router.post('/public/contact', contactLimiter, pub.contact);

export default router;
