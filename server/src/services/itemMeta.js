import { tmdbFetch, hasTmdbKey } from './tmdb.js';
import { normalizeItem } from './normalize.js';
import { cached } from './cache.js';
import { DEMO_ITEMS_BY_ID, demoSeasons } from '../data/demo.js';

const TTL = 30 * 60 * 1000;

export async function getItemMeta(mediaType, id) {
  if (!hasTmdbKey()) return DEMO_ITEMS_BY_ID[`${mediaType}:${id}`] || null;
  try {
    const data = await cached(`meta:${mediaType}:${id}`, TTL, () => tmdbFetch(`/${mediaType}/${id}`));
    return normalizeItem(data, mediaType);
  } catch {
    return null;
  }
}

export async function getSeasonEpisodeCount(mediaType, id, seasonNumber) {
  if (mediaType !== 'tv') return null;
  if (!hasTmdbKey()) {
    const seasons = demoSeasons(id);
    return seasons.find((s) => s.seasonNumber === seasonNumber)?.episodeCount || null;
  }
  try {
    const data = await cached(`season:${id}:${seasonNumber}`, TTL, () => tmdbFetch(`/tv/${id}/season/${seasonNumber}`));
    return (data.episodes || []).length;
  } catch {
    return null;
  }
}
