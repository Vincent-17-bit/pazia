import ExternalTitle from '../../models/ExternalTitle.js';
import { normalizeExternal } from '../externalNormalize.js';
import { dbReady } from '../db.js';

function toCard(doc) {
  return normalizeExternal({
    source: doc.source,
    refId: doc.sourceId,
    title: doc.title,
    overview: doc.description,
    posterPath: doc.posterPath,
    mediaType: doc.mediaType,
    playback: doc.playback?.type === 'mp4'
      ? { type: 'mp4', url: doc.playback.url }
      : doc.playback?.type === 'youtube_embed'
        ? { type: 'youtube_embed', videoId: doc.playback.videoId }
        : { type: 'iframe', url: doc.playback.url },
    license: doc.license,
    year: doc.year,
    runtimeMinutes: doc.runtimeMinutes,
  });
}

// Longest-first ranking per spec: 90-minute-plus feature-length titles
// ahead of everything else, then by raw runtime within each tier.
function rankSort(a, b) {
  const aFeature = a.runtimeMinutes >= 90 ? 1 : 0;
  const bFeature = b.runtimeMinutes >= 90 ? 1 : 0;
  if (aFeature !== bFeature) return bFeature - aFeature;
  return b.runtimeMinutes - a.runtimeMinutes;
}

export async function getIngestedRowItems(rowKey, { limit = 30 } = {}) {
  if (!dbReady) return [];
  const docs = await ExternalTitle.find({ rows: rowKey, status: 'active' })
    .select('source sourceId title description posterPath mediaType playback license year runtimeMinutes season episode')
    .limit(limit * 2)
    .lean();
  return docs.sort(rankSort).slice(0, limit).map(toCard);
}

export async function getIngestedItem(source, refId) {
  if (!dbReady) return null;
  const doc = await ExternalTitle.findOne({ source, sourceId: String(refId), status: { $ne: 'blocked' } }).lean();
  if (!doc) return null;
  return toCard(doc);
}
