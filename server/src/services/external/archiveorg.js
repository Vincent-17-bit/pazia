import { normalizeExternal } from '../externalNormalize.js';

const SEARCH_URL = 'https://archive.org/advancedsearch.php';
const META_URL = (id) => `https://archive.org/metadata/${id}`;
const THUMB_URL = (id) => `https://archive.org/services/img/${id}`;

export async function search({ query = '', collection, rows = 20 } = {}) {
  const q = [query, collection ? `collection:${collection}` : '', 'mediatype:(movies)']
    .filter(Boolean)
    .join(' AND ');
  const url = new URL(SEARCH_URL);
  url.searchParams.set('q', q);
  url.searchParams.set('fl[]', 'identifier');
  url.searchParams.append('fl[]', 'title');
  url.searchParams.append('fl[]', 'description');
  url.searchParams.append('fl[]', 'year');
  url.searchParams.set('rows', rows);
  url.searchParams.set('output', 'json');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`archive.org ${res.status}`);
  const data = await res.json();
  const docs = data.response?.docs || [];
  return docs.map((d) =>
    normalizeExternal({
      source: collection === 'prelinger' ? 'prelinger' : 'archiveorg',
      refId: d.identifier,
      title: d.title,
      overview: Array.isArray(d.description) ? d.description[0] : d.description,
      posterPath: THUMB_URL(d.identifier),
      year: d.year,
    })
  );
}

export async function resolvePlayback(identifier) {
  const res = await fetch(META_URL(identifier));
  if (!res.ok) throw new Error(`archive.org metadata ${res.status}`);
  const data = await res.json();
  const files = data.files || [];
  const mp4 = files.find((f) => f.name?.toLowerCase().endsWith('.mp4'));
  if (mp4) return { type: 'mp4', url: `https://archive.org/download/${identifier}/${mp4.name}` };
  return { type: 'iframe', url: `https://archive.org/embed/${identifier}` };
}
