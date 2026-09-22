import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    mediaType: { type: String, enum: ['movie', 'tv'], required: true },
    tmdbId: { type: String, required: true },
    season: { type: Number, default: null },
    episode: { type: Number, default: null },
    provider: { type: String, enum: ['archiveorg', 'youtube', 'cdn_hls'], required: true },
    type: { type: String, enum: ['hls', 'mp4', 'youtube'], required: true },
    url: { type: String },
    videoId: { type: String },
    subtitles: [{ lang: String, url: String }],
    license: { type: String, default: 'licensed' },
  },
  { versionKey: false }
);

schema.index({ mediaType: 1, tmdbId: 1, season: 1, episode: 1 });

export default mongoose.models.ContentSource || mongoose.model('ContentSource', schema);
