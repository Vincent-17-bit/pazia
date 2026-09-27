import { normalizeExternal } from '../externalNormalize.js';
import { probeMp4DurationSeconds } from '../mp4Duration.js';

const SEARCH_URL = 'https://images-api.nasa.gov/search';
const ASSET_URL = 'https://images-api.nasa.gov/asset';
const POOL_SIZE = 40; // over-fetch so long-form videos have a chance to rank in
const PROBE_CONCURRENCY = 10;

async function findMp4Url(nasaId) {
  const res = await fetch(`${ASSET_URL}/${nasaId}`);
  if (!res.ok) throw new Error(`nasa asset ${res.status}`);
  const data = await res.json();
  const items = data.collection?.items || [];
  const mp4 = items.map((i) => i.href).find((h) => h.endsWith('.mp4') && !h.includes('~orig'));
  return mp4 ? mp4.replace(/^http:/, 'https:') : null;
}

async function mapWithConcurrency(list, limit, fn) {
  const results = new Array(list.length);
  let next = 0;
  async function worker() {
    while (next < list.length) {
      const i = next++;
      results[i] = await fn(list[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker));
  return results;
}

export async function search({ query = 'space', rows = 20 } = {}) {
  const url = new URL(SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('media_type', 'video');
  url.searchParams.set('page_size', String(POOL_SIZE));

  const res = await fetch(url);
  if (!res.ok) throw new Error(`nasa ${res.status}`);
  const data = await res.json();

  const candidates = (data.collection?.items || [])
    .slice(0, POOL_SIZE)
    .map((it) => {
      const meta = it.data?.[0] || {};
      return {
        nasaId: meta.nasa_id,
        title: meta.title,
        overview: meta.description,
        posterPath: it.links?.find((l) => l.rel === 'preview')?.href || null,
        year: meta.date_created ? meta.date_created.slice(0, 4) : null,
      };
    })
    .filter((c) => c.nasaId);

  // real duration isn't in NASA's search metadata — probe each candidate's
  // mp4 header via range request so longer videos can rank ahead of clips
  const withDuration = await mapWithConcurrency(candidates, PROBE_CONCURRENCY, async (c) => {
    try {
      const mp4Url = await findMp4Url(c.nasaId);
      const durationSec = mp4Url ? await probeMp4DurationSeconds(mp4Url) : 0;
      return { ...c, durationSec };
    } catch {
      return { ...c, durationSec: 0 };
    }
  });

  return withDuration
    .sort((a, b) => b.durationSec - a.durationSec)
    .slice(0, rows)
    .map((c) =>
      normalizeExternal({
        source: 'nasa',
        refId: c.nasaId,
        title: c.title,
        overview: c.overview,
        posterPath: c.posterPath,
        year: c.year,
        runtimeMinutes: c.durationSec ? Math.round(c.durationSec / 60) : null,
      })
    );
}

export async function resolvePlayback(nasaId) {
  const mp4 = await findMp4Url(nasaId);
  if (!mp4) throw new Error('no mp4 asset found');
  return { type: 'mp4', url: mp4 };
}
