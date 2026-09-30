import { EXTERNAL_ROW_MAPPING } from '../data/externalRows.js';
import { searchSource } from './external/index.js';
import { cached } from './cache.js';
import { getIngestedItem } from './ingest/read.js';

const TTL = 60 * 60 * 1000; // default: these sources change slowly, cache longer than TMDB rows

export async function getExternalRowItems(key) {
  const mapping = EXTERNAL_ROW_MAPPING[key];
  if (!mapping) return [];
  const ttl = mapping.ttlMs || TTL;
  return cached(`external:${key}`, ttl, async () => {
    try {
      return await searchSource(mapping.source, mapping.params);
    } catch (err) {
      console.error(`[external] ${key} failed:`, err.message);
      return [];
    }
  });
}

export async function getExternalItem(source, refId) {
  // ingestion pipeline titles (source 'archiveorg'/'youtube' as written by
  // the ingest jobs) are stored in our own DB - check there first so
  // playback never depends on a live call to the origin site
  try {
    const ingested = await getIngestedItem(source, refId);
    if (ingested) return ingested;
  } catch (err) {
    console.error('[external] ingested item lookup failed:', err.message);
  }

  const key = Object.keys(EXTERNAL_ROW_MAPPING).find((k) => EXTERNAL_ROW_MAPPING[k].source === source);
  if (!key) return null;
  const items = await getExternalRowItems(key);
  return items.find((i) => String(i.refId) === String(refId)) || null;
}
