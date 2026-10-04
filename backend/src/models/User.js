import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 400 },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true, index: true },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active', index: true },
    lastLogin: { type: Date, default: null },
    tokenVersion: { type: Number, default: 0, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExp: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.resetTokenHash;
    delete ret.resetTokenExp;
    delete ret.tokenVersion;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
