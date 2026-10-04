import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '', maxlength: 400 },
    image: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
