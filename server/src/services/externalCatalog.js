import { EXTERNAL_ROW_MAPPING } from '../data/externalRows.js';
import { searchSource } from './external/index.js';
import { cached } from './cache.js';

const TTL = 60 * 60 * 1000; // these sources change slowly, cache longer than TMDB rows

export async function getExternalRowItems(key) {
  const mapping = EXTERNAL_ROW_MAPPING[key];
  if (!mapping) return [];
  return cached(`external:${key}`, TTL, async () => {
    try {
      return await searchSource(mapping.source, mapping.params);
    } catch (err) {
      console.error(`[external] ${key} failed:`, err.message);
      return [];
    }
  });
}

export async function getExternalItem(source, refId) {
  const key = Object.keys(EXTERNAL_ROW_MAPPING).find((k) => EXTERNAL_ROW_MAPPING[k].source === source);
  if (!key) return null;
  const items = await getExternalRowItems(key);
  return items.find((i) => String(i.refId) === String(refId)) || null;
}
