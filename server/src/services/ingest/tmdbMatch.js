import { tmdbFetch, hasTmdbKey, posterUrl, backdropUrl } from '../tmdb.js';
import { titleSimilarity } from './common.js';

const CONFIDENCE_THRESHOLD = 0.72;

async function searchOne(mediaType, title, year) {
  const params = { query: title };
  if (year) params.year = year;
  const data = await tmdbFetch(`/search/${mediaType}`, params);
  return data.results || [];
}

// Matches an ingested title to TMDB by name+year so we can show real
// posters/backdrops/overviews. Returns null when there's no confident
// match, so callers fall back to the source thumbnail per spec.
export async function matchTmdb(title, year, mediaTypeHint = 'movie') {
  if (!hasTmdbKey() || !title) return null;

  const order = mediaTypeHint === 'tv' ? ['tv', 'movie'] : ['movie', 'tv'];
  let best = null;

  for (const mediaType of order) {
    let results = [];
    try {
      results = await searchOne(mediaType, title, year);
    } catch {
      continue;
    }
    for (const r of results) {
      const candidateTitle = r.title || r.name || '';
      const candidateYear = (r.release_date || r.first_air_date || '').slice(0, 4);
      const sim = titleSimilarity(title, candidateTitle);
      const yearDelta = year && candidateYear ? Math.abs(Number(year) - Number(candidateYear)) : 1;
      const yearOk = !year || !candidateYear || yearDelta <= 1;
      const score = sim - (yearOk ? 0 : 0.25);
      if (score > (best?.score ?? -1)) {
        best = { score, mediaType, id: r.id, posterPath: r.poster_path, backdropPath: r.backdrop_path, overview: r.overview, candidateYear, genreIds: r.genre_ids || [] };
      }
    }
  }

  if (!best || best.score < CONFIDENCE_THRESHOLD) return null;

  return {
    tmdbId: String(best.id),
    tmdbMediaType: best.mediaType,
    posterPath: posterUrl(best.posterPath),
    backdropPath: backdropUrl(best.backdropPath),
    overview: best.overview || null,
    genreIds: best.genreIds,
  };
}
