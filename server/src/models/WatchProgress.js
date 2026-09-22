import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    mediaType: { type: String, enum: ['movie', 'tv'], required: true },
    tmdbId: { type: String, required: true },
    season: { type: Number, default: null },
    episode: { type: Number, default: null },
    position: { type: Number, required: true },
    duration: { type: Number, required: true },
    watched: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

schema.index({ userId: 1, mediaType: 1, tmdbId: 1, season: 1, episode: 1 }, { unique: true });

export default mongoose.models.WatchProgress || mongoose.model('WatchProgress', schema);
