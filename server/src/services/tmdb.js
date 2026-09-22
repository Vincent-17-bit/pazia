const BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

export const hasTmdbKey = () => Boolean(process.env.TMDB_API_KEY);

export async function tmdbFetch(path, params = {}) {
  const url = new URL(BASE + path);
  url.searchParams.set('api_key', process.env.TMDB_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`TMDB ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

export function posterUrl(path, size = 'w342') {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}

export function backdropUrl(path, size = 'w1280') {
  return path ? `${IMG_BASE}/${size}${path}` : null;
}
