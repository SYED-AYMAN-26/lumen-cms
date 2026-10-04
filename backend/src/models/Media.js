import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, default: '' },
    url: { type: String, required: true },
    mimeType: { type: String, default: '' },
    kind: { type: String, enum: ['image', 'video', 'other'], default: 'other', index: true },
    size: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    altText: { type: String, default: '', maxlength: 200 },
    caption: { type: String, default: '', maxlength: 300 },
    title: { type: String, default: '', maxlength: 160 },
    isPublic: { type: Boolean, default: false },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

mediaSchema.index({ originalName: 1, title: 1 });

export default mongoose.model('Media', mediaSchema);
