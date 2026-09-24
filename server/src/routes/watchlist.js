import { Router } from 'express';
import Watchlist from '../models/Watchlist.js';
import { dbReady } from '../services/db.js';
import { memWatchlist } from '../services/memoryStore.js';

const router = Router();

router.get('/', async (req, res) => {
  if (dbReady) {
    const list = await Watchlist.find({ userId: req.userId }).sort({ addedAt: -1 }).lean();
    return res.json({ items: list });
  }
  res.json({ items: memWatchlist.list(req.userId) });
});

router.post('/', async (req, res) => {
  const { mediaType, tmdbId } = req.body || {};
  if (!mediaType || !tmdbId) return res.status(400).json({ error: 'missing_fields' });
  if (!['movie', 'tv'].includes(mediaType)) return res.status(400).json({ error: 'invalid_media_type' });

  if (dbReady) {
    const doc = await Watchlist.findOneAndUpdate(
      { userId: req.userId, mediaType, tmdbId: String(tmdbId) },
      { userId: req.userId, mediaType, tmdbId: String(tmdbId) },
      { upsert: true, new: true }
    );
    return res.json(doc);
  }
  res.json(memWatchlist.add(req.userId, mediaType, String(tmdbId)));
});

router.delete('/:mediaType/:tmdbId', async (req, res) => {
  const { mediaType, tmdbId } = req.params;
  if (dbReady) {
    await Watchlist.deleteOne({ userId: req.userId, mediaType, tmdbId });
    return res.json({ ok: true });
  }
  memWatchlist.remove(req.userId, mediaType, tmdbId);
  res.json({ ok: true });
});

export default router;
