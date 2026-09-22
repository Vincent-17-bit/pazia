import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    mediaType: { type: String, enum: ['movie', 'tv'], required: true },
    tmdbId: { type: String, required: true },
    season: { type: Number, default: null },
    episode: { type: Number, default: null },
    watchedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

export default mongoose.models.HistoryEntry || mongoose.model('HistoryEntry', schema);
