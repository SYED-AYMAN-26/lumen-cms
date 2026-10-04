import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    slug: { type: String, required: true, unique: true, lowercase: true },
  },
  { timestamps: true }
);

export default mongoose.model('Tag', tagSchema);
