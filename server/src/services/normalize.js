import { posterUrl, backdropUrl } from './tmdb.js';

export function normalizeItem(raw, mediaTypeHint) {
  const mediaType = raw.media_type || mediaTypeHint || (raw.first_air_date ? 'tv' : 'movie');
  const title = raw.title || raw.name || 'Untitled';
  const date = raw.release_date || raw.first_air_date || '';
  return {
    id: String(raw.id),
    mediaType,
    title,
    overview: raw.overview || '',
    posterPath: posterUrl(raw.poster_path),
    backdropPath: backdropUrl(raw.backdrop_path),
    rating: raw.vote_average ? Number(raw.vote_average.toFixed(1)) : null,
    year: date ? date.slice(0, 4) : null,
    genreIds: raw.genre_ids || (raw.genres ? raw.genres.map((g) => g.id) : []),
  };
}

export function normalizeList(list, mediaTypeHint) {
  return (list || [])
    .filter((r) => r && (r.poster_path || r.backdrop_path || mediaTypeHint))
    .map((r) => normalizeItem(r, mediaTypeHint));
}
