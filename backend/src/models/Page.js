import mongoose from 'mongoose';

const revisionSchema = new mongoose.Schema(
  {
    title: String,
    excerpt: String,
    body: String,
    status: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { _id: true }
);

const seoSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    canonical: { type: String, default: '' },
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    ogImage: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, default: '', maxlength: 500 },
    content: { type: String, default: '' },
    featuredImage: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'review', 'scheduled', 'published', 'archived', 'trash'],
      default: 'draft',
      index: true,
    },
    publishAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
    seo: { type: seoSchema, default: () => ({}) },
    revisions: { type: [revisionSchema], default: [] },
    reviewNote: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Page', pageSchema);
