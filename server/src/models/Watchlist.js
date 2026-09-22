import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    mediaType: { type: String, enum: ['movie', 'tv'], required: true },
    tmdbId: { type: String, required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

schema.index({ userId: 1, mediaType: 1, tmdbId: 1 }, { unique: true });

export default mongoose.models.Watchlist || mongoose.model('Watchlist', schema);
