import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    mediaType: { type: String, enum: ['movie', 'tv'], required: true },
    tmdbId: { type: String, required: true },
    value: { type: String, enum: ['up', 'down', 'love'], required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

schema.index({ userId: 1, mediaType: 1, tmdbId: 1 }, { unique: true });

export default mongoose.models.Rating || mongoose.model('Rating', schema);
