import { Router } from 'express';
import { tmdbFetch, hasTmdbKey } from '../services/tmdb.js';
import { normalizeItem, normalizeList } from '../services/normalize.js';
import { cached } from '../services/cache.js';
import { resolveSource } from '../providers/index.js';
import {
  DEMO_ITEMS_BY_ID,
  DEMO_CAST,
  DEMO_PROVIDERS,
  demoSeasons,
  demoEpisodes,
  DEMO_ROWS,
} from '../data/demo.js';

const router = Router();
const TTL = 30 * 60 * 1000;

router.get('/:mediaType/:id', async (req, res) => {
  const { mediaType, id } = req.params;
  if (!['movie', 'tv'].includes(mediaType)) return res.status(400).json({ error: 'bad_media_type' });

  if (!hasTmdbKey()) {
    const item = DEMO_ITEMS_BY_ID[`${mediaType}:${id}`];
    if (!item) return res.status(404).json({ error: 'not_found' });
    const source = await resolveSource(mediaType, id, null, null);
    return res.json({
      ...item,
      cast: DEMO_CAST,
      crew: [{ name: 'J. Mwangi', job: 'Director' }],
      trailers: [],
      watchProviders: DEMO_PROVIDERS,
      similar: DEMO_ROWS.home.filter((i) => i.id !== id).slice(0, 8),
      seasons: mediaType === 'tv' ? demoSeasons(id) : undefined,
      hasLicensedSource: Boolean(source),
    });
  }

  try {
    const key = `title:${mediaType}:${id}`;
    const detail = await cached(key, TTL, async () => {
      const [main, credits, videos, providers, similar] = await Promise.all([
        tmdbFetch(`/${mediaType}/${id}`),
        tmdbFetch(`/${mediaType}/${id}/credits`),
        tmdbFetch(`/${mediaType}/${id}/videos`),
        tmdbFetch(`/${mediaType}/${id}/watch/providers`),
        tmdbFetch(`/${mediaType}/${id}/similar`),
      ]);
      return {
        ...normalizeItem(main, mediaType),
        genres: (main.genres || []).map((g) => g.name),
        runtime: main.runtime || main.episode_run_time?.[0] || null,
        cast: (credits.cast || []).slice(0, 12).map((c) => ({
          name: c.name,
          character: c.character,
          profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null,
        })),
        crew: (credits.crew || [])
          .filter((c) => ['Director', 'Creator'].includes(c.job))
          .map((c) => ({ name: c.name, job: c.job })),
        trailers: (videos.results || [])
          .filter((v) => v.site === 'YouTube' && v.type === 'Trailer')
          .map((v) => ({ key: v.key, name: v.name })),
        watchProviders: {
          KE: providers.results?.KE || null,
          US: providers.results?.US || null,
        },
        similar: normalizeList(similar.results, mediaType).slice(0, 12),
        seasons:
          mediaType === 'tv'
            ? (main.seasons || []).map((s) => ({
                seasonNumber: s.season_number,
                episodeCount: s.episode_count,
                name: s.name,
              }))
            : undefined,
      };
    });
    const source = await resolveSource(mediaType, id, null, null);
    res.json({ ...detail, hasLicensedSource: Boolean(source) });
  } catch (err) {
    res.status(502).json({ error: 'title_failed', message: err.message });
  }
});

router.get('/tv/:id/season/:n', async (req, res) => {
  const { id, n } = req.params;
  const seasonNumber = parseInt(n, 10);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = 30;

  let episodes;
  if (!hasTmdbKey()) {
    episodes = demoEpisodes(id, seasonNumber);
  } else {
    try {
      const key = `season:${id}:${seasonNumber}`;
      const data = await cached(key, TTL, () => tmdbFetch(`/tv/${id}/season/${seasonNumber}`));
      episodes = (data.episodes || []).map((e) => ({
        episodeNumber: e.episode_number,
        name: e.name,
        overview: e.overview,
        stillPath: e.still_path ? `https://image.tmdb.org/t/p/w300${e.still_path}` : null,
        runtime: e.runtime,
        airDate: e.air_date,
      }));
    } catch (err) {
      return res.status(502).json({ error: 'season_failed', message: err.message });
    }
  }

  const start = (page - 1) * pageSize;
  const pageItems = episodes.slice(start, start + pageSize);
  res.json({
    seasonNumber,
    total: episodes.length,
    page,
    pageSize,
    hasMore: start + pageSize < episodes.length,
    episodes: pageItems,
  });
});

export default router;
