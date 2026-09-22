import { Router } from 'express';
import { tmdbFetch, hasTmdbKey } from '../services/tmdb.js';
import { normalizeList } from '../services/normalize.js';
import { cached } from '../services/cache.js';
import { DEMO_ROWS, TOP_SEARCHES } from '../data/demo.js';

const router = Router();
const TTL = 15 * 60 * 1000;

function demoSearch(q, genre, year, minRating) {
  const all = Object.values(DEMO_ROWS).flat();
  const seen = new Set();
  return all.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    if (q && !item.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (genre && !item.genres.some((g) => g.toLowerCase() === genre.toLowerCase())) return false;
    if (year && String(item.year) !== String(year)) return false;
    if (minRating && item.rating < Number(minRating)) return false;
    return true;
  });
}

router.get('/', async (req, res) => {
  const { q = '', type, genre, language, year, minRating, page = '1' } = req.query;

  if (!q && !genre && !language && !year && !minRating) {
    return res.json({ items: [], topSearches: TOP_SEARCHES });
  }

  if (!hasTmdbKey()) {
    return res.json({ items: demoSearch(q, genre, year, minRating), topSearches: TOP_SEARCHES });
  }

  try {
    const key = `search:${q}:${type}:${genre}:${language}:${year}:${minRating}:${page}`;
    const items = await cached(key, TTL, async () => {
      if (q) {
        const data = await tmdbFetch('/search/multi', { query: q, page });
        let results = normalizeList(data.results);
        if (type) results = results.filter((r) => r.mediaType === type);
        return results;
      }
      const mediaType = type === 'tv' ? 'tv' : 'movie';
      const data = await tmdbFetch(`/discover/${mediaType}`, {
        with_genres: genre,
        with_original_language: language,
        primary_release_year: mediaType === 'movie' ? year : undefined,
        first_air_date_year: mediaType === 'tv' ? year : undefined,
        'vote_average.gte': minRating,
        page,
      });
      return normalizeList(data.results, mediaType);
    });
    res.json({ items, topSearches: TOP_SEARCHES });
  } catch (err) {
    res.status(502).json({ error: 'search_failed', message: err.message });
  }
});

export default router;
