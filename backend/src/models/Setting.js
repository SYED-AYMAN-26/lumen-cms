import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'site', unique: true },
    general: {
      siteName: { type: String, default: 'Lumen' },
      description: { type: String, default: 'A journal of design, technology, and making.' },
      logo: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
      favicon: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
      contactEmail: { type: String, default: 'hello@lumen.cms' },
      timezone: { type: String, default: 'Asia/Kolkata' },
    },
    content: {
      postsPerPage: { type: Number, default: 9 },
      defaultCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    },
    users: {
      registrationEnabled: { type: Boolean, default: false },
      defaultRole: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
    },
    media: {
      maxUploadMb: { type: Number, default: 25 },
      allowedImageTypes: { type: [String], default: ['jpg', 'jpeg', 'png', 'webp', 'svg'] },
      allowedVideoTypes: { type: [String], default: ['mp4', 'webm'] },
    },
    security: {
      minPasswordLength: { type: Number, default: 8 },
      requireUppercase: { type: Boolean, default: true },
      requireNumber: { type: Boolean, default: true },
      requireSymbol: { type: Boolean, default: true },
      tokenExpiryHours: { type: Number, default: 12 },
      rememberExpiryDays: { type: Number, default: 30 },
    },
  },
  { timestamps: true }
);

settingSchema.statics.getSite = async function getSite() {
  let doc = await this.findOne({ key: 'site' });
  if (!doc) doc = await this.create({ key: 'site' });
  return doc;
};

export default mongoose.model('Setting', settingSchema);
