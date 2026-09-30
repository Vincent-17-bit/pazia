import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    source: { type: String, enum: ['archiveorg', 'youtube'], required: true },
    sourceId: { type: String, required: true },
    mediaType: { type: String, enum: ['movie', 'tv'], default: 'movie' },
    seriesKey: { type: String, default: null },
    season: { type: Number, default: null },
    episode: { type: Number, default: null },

    title: { type: String, required: true },
    description: { type: String, default: '' },
    runtimeMinutes: { type: Number, required: true },
    genre: [{ type: String }],
    year: { type: String, default: null },
    language: { type: String, default: null },
    posterPath: { type: String, default: null },
    backdropPath: { type: String, default: null },

    playback: {
      type: { type: String, enum: ['mp4', 'iframe', 'youtube_embed'], required: true },
      url: { type: String, default: null },
      videoId: { type: String, default: null },
    },
    license: { type: String, required: true },
    downloads: { type: Number, default: 0 },

    rows: [{ type: String }],
    tmdbId: { type: String, default: null },
    tmdbMediaType: { type: String, default: null },
    tmdbAttribution: { type: Boolean, default: false },

    channelId: { type: String, default: null },
    collection: { type: String, default: null },
    embeddable: { type: Boolean, default: true },
    madeForKids: { type: Boolean, default: false },

    status: { type: String, enum: ['active', 'hidden', 'blocked'], default: 'active', index: true },
    statusReason: { type: String, default: null },

    lastRefreshedAt: { type: Date, default: Date.now },
    addedManually: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ source: 1, sourceId: 1, season: 1, episode: 1 }, { unique: true });
schema.index({ rows: 1, status: 1, runtimeMinutes: -1 });
schema.index({ source: 1, lastRefreshedAt: 1 });
schema.index({ title: 1, year: 1 });

export default mongoose.models.ExternalTitle || mongoose.model('ExternalTitle', schema);
