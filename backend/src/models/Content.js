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

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    embedUrl: { type: String, default: '' },
    media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    thumbnail: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    captions: { type: String, default: '' },
    source: { type: String, enum: ['upload', 'youtube', 'vimeo', 'external'], default: 'external' },
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

const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, default: '', maxlength: 500 },
    body: { type: String, default: '' },
    featuredImage: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    gallery: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    videos: { type: [videoSchema], default: [] },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    type: {
      type: String,
      enum: ['post', 'article', 'news', 'announcement'],
      default: 'post',
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'review', 'scheduled', 'published', 'archived', 'trash'],
      default: 'draft',
      index: true,
    },
    publishAt: { type: Date, default: null, index: true },
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

contentSchema.index({ status: 1, deletedAt: 1, publishedAt: -1 });

export default mongoose.model('Content', contentSchema);
