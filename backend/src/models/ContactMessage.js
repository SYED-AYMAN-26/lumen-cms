import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, required: true, maxlength: 160 },
    subject: { type: String, default: '', maxlength: 160 },
    message: { type: String, required: true, maxlength: 4000 },
    kind: { type: String, enum: ['contact', 'subscribe'], default: 'contact' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('ContactMessage', contactSchema);
