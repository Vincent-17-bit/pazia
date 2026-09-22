import ContentSource from '../models/ContentSource.js';
import { dbReady } from '../services/db.js';
import { memContentSources } from '../services/memoryStore.js';

export async function resolveSource(mediaType, tmdbId, season, episode) {
  let doc;
  if (dbReady) {
    doc = await ContentSource.findOne({
      mediaType,
      tmdbId: String(tmdbId),
      season: season ?? null,
      episode: episode ?? null,
    }).lean();
  } else {
    doc = memContentSources.find(mediaType, tmdbId, season, episode);
  }
  if (!doc) return null;

  return {
    provider: doc.provider,
    type: doc.type,
    url: doc.url || undefined,
    videoId: doc.videoId || undefined,
    subtitles: doc.subtitles || [],
    license: doc.license || 'licensed',
  };
}
