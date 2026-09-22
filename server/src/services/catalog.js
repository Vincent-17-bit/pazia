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

const keywordIdCache = new Map();
async function resolveKeywordIds(query) {
  if (keywordIdCache.has(query)) return keywordIdCache.get(query);
  const data = await tmdbFetch('/search/keyword', { query });
  const ids = (data.results || []).slice(0, 3).map((k) => k.id);
  keywordIdCache.set(query, ids);
  return ids;
}

async function fetchByKeywordQuery(mediaType, keywordQuery, extraParams = {}, page) {
  const ids = await resolveKeywordIds(keywordQuery);
  if (!ids.length) return [];
  const data = await tmdbFetch(`/discover/${mediaType}`, { with_keywords: ids.join('|'), ...extraParams, page });
  return normalizeList(data.results, mediaType);
}

async function fetchMulti(paramsByType, page) {
  const lists = await Promise.all(
    Object.entries(paramsByType).map(([mediaType, params]) => fetchDiscover(mediaType, params, page))
  );
  return lists.flat();
}

async function fetchMerge(mediaType, paramsList, page) {
  const lists = await Promise.all(paramsList.map((params) => fetchDiscover(mediaType, params, page)));
  const seen = new Set();
  return lists.flat().filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)));
}

async function resolveMapping(mapping, page = 1) {
  if (mapping.source === 'trending') return fetchTrending();
  if (mapping.source === 'discover') return fetchDiscover(mapping.mediaType, mapping.params, page);
  if (mapping.source === 'discover_swahili') return fetchSwahili(page);
  if (mapping.source === 'discover_keyword') return fetchByKeyword(mapping.mediaType, page);
  if (mapping.source === 'discover_keyword_query') return fetchByKeywordQuery(mapping.mediaType, mapping.keywordQuery, mapping.params, page);
  if (mapping.source === 'discover_multi') return fetchMulti(mapping.paramsByType, page);
  if (mapping.source === 'discover_merge') return fetchMerge(mapping.mediaType, mapping.paramsList, page);
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
