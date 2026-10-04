import Content from '../models/Content.js';
import Page from '../models/Page.js';
import User from '../models/User.js';
import Media from '../models/Media.js';
import Category from '../models/Category.js';
import ActivityLog from '../models/ActivityLog.js';
import { asyncHandler } from '../utils/helpers.js';

function weekStart(offset) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay() - offset * 7);
  return d;
}

export const stats = asyncHandler(async (_req, res) => {
  const since = weekStart(7);
  const [
    contentTotal, pageTotal, publishedC, publishedP, draftC, draftP, scheduledC, scheduledP,
    reviewC, reviewP, archivedC, archivedP, trashC, trashP, users, media, categories,
    statusC, statusP, byCategory, recentActivity, recentContent, createdC, createdP, activityDays, mediaKinds,
  ] = await Promise.all([
    Content.countDocuments({ deletedAt: null }),
    Page.countDocuments({ deletedAt: null }),
    Content.countDocuments({ status: 'published', deletedAt: null }),
    Page.countDocuments({ status: 'published', deletedAt: null }),
    Content.countDocuments({ status: 'draft', deletedAt: null }),
    Page.countDocuments({ status: 'draft', deletedAt: null }),
    Content.countDocuments({ status: 'scheduled', deletedAt: null }),
    Page.countDocuments({ status: 'scheduled', deletedAt: null }),
    Content.countDocuments({ status: 'review', deletedAt: null }),
    Page.countDocuments({ status: 'review', deletedAt: null }),
    Content.countDocuments({ status: 'archived', deletedAt: null }),
    Page.countDocuments({ status: 'archived', deletedAt: null }),
    Content.countDocuments({ deletedAt: { $ne: null } }),
    Page.countDocuments({ deletedAt: { $ne: null } }),
    User.countDocuments(),
    Media.countDocuments(),
    Category.countDocuments(),
    Content.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Page.aggregate([{ $match: { deletedAt: null } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Content.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'cat' } },
      { $project: { count: 1, name: { $ifNull: [{ $arrayElemAt: ['$cat.name', 0] }, 'Uncategorized'] } } },
      { $sort: { count: -1 } },
    ]),
    ActivityLog.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(8),
    Content.find({ deletedAt: null }).select('title status type updatedAt slug author').populate('author', 'name').sort({ updatedAt: -1 }).limit(6),
    Content.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
    Page.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
    ActivityLog.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Media.aggregate([{ $group: { _id: '$kind', count: { $sum: 1 } } }]),
  ]);

  const dayMap = {};
  for (const row of [...createdC, ...createdP]) dayMap[row._id] = (dayMap[row._id] || 0) + row.count;
  const contentOverTime = [];
  for (let i = 7; i >= 0; i -= 1) {
    const start = weekStart(i);
    const end = weekStart(i - 1);
    let count = 0;
    for (const [day, n] of Object.entries(dayMap)) {
      const t = new Date(day).getTime();
      if (t >= start.getTime() && t < end.getTime()) count += n;
    }
    contentOverTime.push({
      label: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      count,
    });
  }

  const statusMap = {};
  for (const row of [...statusC, ...statusP]) statusMap[row._id] = (statusMap[row._id] || 0) + row.count;

  const activityMap = Object.fromEntries(activityDays.map((d) => [d._id, d.count]));
  const userActivity = [];
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    userActivity.push({ label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), count: activityMap[key] || 0 });
  }

  res.json({
    success: true,
    data: {
      counts: {
        totalContent: contentTotal + pageTotal,
        posts: contentTotal,
        pages: pageTotal,
        published: publishedC + publishedP,
        draft: draftC + draftP,
        scheduled: scheduledC + scheduledP,
        review: reviewC + reviewP,
        archived: archivedC + archivedP,
        trash: trashC + trashP,
        users,
        media,
        categories,
      },
      statusBreakdown: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
      byCategory: byCategory.map((c) => ({ name: c.name, count: c.count })),
      contentOverTime,
      userActivity,
      mediaKinds: mediaKinds.map((m) => ({ kind: m._id, count: m.count })),
      recentActivity,
      recentContent,
    },
  });
});
