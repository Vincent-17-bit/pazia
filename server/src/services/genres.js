import { tmdbFetch, hasTmdbKey } from './tmdb.js';

export const registry = {
  movieGenres: [],
  tvGenres: [],
  theatreKeywordIds: [],
};

export async function loadGenresAndKeywords() {
  if (!hasTmdbKey()) {
    console.warn('[startup] TMDB_API_KEY missing — running in demo data mode');
    return;
  }
  try {
    const [movieGenres, tvGenres] = await Promise.all([
      tmdbFetch('/genre/movie/list'),
      tmdbFetch('/genre/tv/list'),
    ]);
    registry.movieGenres = movieGenres.genres || [];
    registry.tvGenres = tvGenres.genres || [];

    const keywordQueries = ['theatre', 'stage play'];
    const results = await Promise.all(
      keywordQueries.map((q) => tmdbFetch('/search/keyword', { query: q }))
    );
    registry.theatreKeywordIds = results
      .flatMap((r) => r.results || [])
      .map((k) => k.id);

    console.log(
      `[startup] loaded ${registry.movieGenres.length} movie genres, ${registry.tvGenres.length} tv genres, ${registry.theatreKeywordIds.length} theatre keyword ids`
    );
  } catch (err) {
    console.error('[startup] failed to load TMDB genres/keywords, falling back to demo data', err.message);
  }
}
