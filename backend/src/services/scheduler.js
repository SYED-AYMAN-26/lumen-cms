import Content from '../models/Content.js';
import Page from '../models/Page.js';
import ActivityLog from '../models/ActivityLog.js';

async function publishDue(Model, resourceType) {
  const due = await Model.find({
    status: 'scheduled',
    deletedAt: null,
    publishAt: { $lte: new Date() },
  });
  for (const doc of due) {
    doc.status = 'published';
    doc.publishedAt = new Date();
    await doc.save();
    await ActivityLog.create({
      user: null,
      action: `${resourceType}.published`,
      resourceType,
      resourceId: doc._id,
      metadata: { title: doc.title, via: 'scheduler' },
      ip: '',
      createdAt: new Date(),
    });
    console.log(`Scheduled ${resourceType} published: ${doc.title}`);
  }
}

export function startScheduler() {
  const tick = async () => {
    try {
      await publishDue(Content, 'content');
      await publishDue(Page, 'page');
    } catch (err) {
      console.error('Scheduler error', err.message);
    }
  };
  setInterval(tick, 20_000);
  setTimeout(tick, 3_000);
}
