import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, default: '' },
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export default mongoose.model('ActivityLog', activitySchema);
