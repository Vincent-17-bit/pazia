import { tmdbFetch, hasTmdbKey } from './tmdb.js';
import { normalizeList } from './normalize.js';
import { cached } from './cache.js';
import { TAB_MAPPING, ROW_MAPPING } from './tabMapping.js';
import { registry } from './genres.js';
import { DEMO_ROWS, EXTRA_ROWS } from '../data/demo.js';

const TTL = 20 * 60 * 1000;

async function fetchTrending() {
  const data = await tmdbFetch('/trending/all/day');
  return normalizeList(data.results);
}

async function fetchDiscover(mediaType, params, page) {
  const data = await tmdbFetch(`/discover/${mediaType}`, { ...params, page });
  return normalizeList(data.results, mediaType);
}

async function fetchSwahili(page) {
  const [movies, tv] = await Promise.all([
    tmdbFetch('/discover/movie', { with_original_language: 'sw', page }),
    tmdbFetch('/discover/tv', { with_original_language: 'sw', page }),
  ]);
  return [...normalizeList(movies.results, 'movie'), ...normalizeList(tv.results, 'tv')];
}

async function fetchByKeyword(mediaType, page) {
  if (!registry.theatreKeywordIds.length) return [];
  const data = await tmdbFetch(`/discover/${mediaType}`, {
    with_keywords: registry.theatreKeywordIds.join('|'),
    page,
  });
  return normalizeList(data.results, mediaType);
}

async function resolveMapping(mapping, page = 1) {
  if (mapping.source === 'trending') return fetchTrending();
  if (mapping.source === 'discover') return fetchDiscover(mapping.mediaType, mapping.params, page);
  if (mapping.source === 'discover_swahili') return fetchSwahili(page);
  if (mapping.source === 'discover_keyword') return fetchByKeyword(mapping.mediaType, page);
  return [];
}

export async function getTabItems(tab, page = 1) {
  if (!hasTmdbKey()) return DEMO_ROWS[tab] || DEMO_ROWS.home;
  const mapping = TAB_MAPPING[tab];
  if (!mapping) return [];
  return cached(`tab:${tab}:${page}`, TTL, () => resolveMapping(mapping, page));
}

export async function getRowItems(key, page = 1) {
  if (!hasTmdbKey()) return EXTRA_ROWS[key] || [];
  const mapping = ROW_MAPPING[key];
  if (!mapping) return [];
  return cached(`row:${key}:${page}`, TTL, () => resolveMapping(mapping, page));
}
