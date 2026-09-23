import { normalizeExternal } from '../externalNormalize.js';

const SEARCH_URL = 'https://images-api.nasa.gov/search';

export async function search({ query = 'space', rows = 20 } = {}) {
  const url = new URL(SEARCH_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('media_type', 'video');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`nasa ${res.status}`);
  const data = await res.json();
  const items = (data.collection?.items || []).slice(0, rows);
  return items.map((it) => {
    const meta = it.data?.[0] || {};
    return normalizeExternal({
      source: 'nasa',
      refId: meta.nasa_id,
      title: meta.title,
      overview: meta.description,
      posterPath: it.links?.find((l) => l.rel === 'preview')?.href || null,
      year: meta.date_created ? meta.date_created.slice(0, 4) : null,
    });
  });
}

export async function resolvePlayback(nasaId) {
  const res = await fetch(`https://images-api.nasa.gov/asset/${nasaId}`);
  if (!res.ok) throw new Error(`nasa asset ${res.status}`);
  const data = await res.json();
  const items = data.collection?.items || [];
  const mp4 = items.map((i) => i.href).find((h) => h.endsWith('.mp4') && !h.includes('~orig'));
  if (!mp4) throw new Error('no mp4 asset found');
  return { type: 'mp4', url: mp4 };
}
