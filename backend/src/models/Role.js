import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '', maxlength: 300 },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Role', roleSchema);
