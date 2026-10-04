import ActivityLog from '../models/ActivityLog.js';

export async function logActivity(req, { action, resourceType = '', resourceId = null, metadata = {}, userId = undefined, at = undefined }) {
  try {
    await ActivityLog.create({
      user: userId === undefined ? req?.user?._id || null : userId,
      action,
      resourceType,
      resourceId,
      metadata,
      ip: req?.ip || '',
      userAgent: req?.get?.('user-agent')?.slice(0, 240) || '',
      createdAt: at || new Date(),
    });
  } catch (err) {
    console.error('Activity log failed', err.message);
  }
}
