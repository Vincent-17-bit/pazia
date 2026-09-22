import { Router } from 'express';
import WatchProgress from '../models/WatchProgress.js';
import { dbReady } from '../services/db.js';
import { memProgress } from '../services/memoryStore.js';
import { getItemMeta, getSeasonEpisodeCount } from '../services/itemMeta.js';

const router = Router();

function latestPerTitle(records) {
  const map = new Map();
  for (const r of records) {
    const k = `${r.mediaType}:${r.tmdbId}`;
    const existing = map.get(k);
    if (!existing || new Date(r.updatedAt) > new Date(existing.updatedAt)) map.set(k, r);
  }
  return [...map.values()];
}

router.get('/', async (req, res) => {
  const raw = dbReady
    ? await WatchProgress.find({ userId: req.userId }).lean()
    : memProgress.allForUser(req.userId);

  const latest = latestPerTitle(raw).filter((r) => !(r.mediaType === 'movie' && r.watched));

  const items = await Promise.all(
    latest.map(async (r) => {
      const meta = await getItemMeta(r.mediaType, r.tmdbId);
      if (!meta) return null;

      if (r.mediaType === 'tv' && r.watched) {
        const count = await getSeasonEpisodeCount('tv', r.tmdbId, r.season);
        let nextSeason = r.season;
        let nextEpisode = (r.episode || 0) + 1;
        if (count && nextEpisode > count) {
          nextSeason = r.season + 1;
          nextEpisode = 1;
        }
        return {
          ...meta,
          season: nextSeason,
          episode: nextEpisode,
          progressPct: 0,
          label: 'Next Episode',
        };
      }

      return {
        ...meta,
        season: r.season,
        episode: r.episode,
        progressPct: r.duration ? Math.min(100, Math.round((r.position / r.duration) * 100)) : 0,
        label: r.season ? `S${r.season} · E${r.episode}` : null,
      };
    })
  );

  res.json({ items: items.filter(Boolean) });
});

export default router;
