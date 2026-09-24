import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    event: { type: String, required: true, index: true },
    mediaType: { type: String, default: null },
    tmdbId: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.models.Event || mongoose.model('Event', schema);
