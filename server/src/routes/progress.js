import { Router } from 'express';
import WatchProgress from '../models/WatchProgress.js';
import { dbReady } from '../services/db.js';
import { memProgress } from '../services/memoryStore.js';

const router = Router();

router.put('/', async (req, res) => {
  const { mediaType, tmdbId, season = null, episode = null, position, duration } = req.body || {};
  if (!mediaType || !tmdbId || position == null || duration == null) {
    return res.status(400).json({ error: 'missing_fields' });
  }
  const watched = duration > 0 && position / duration >= 0.95;
  const doc = { mediaType, tmdbId: String(tmdbId), season, episode, position, duration, watched, updatedAt: Date.now() };

  if (dbReady) {
    const existing = await WatchProgress.findOne({ userId: req.userId, mediaType, tmdbId: String(tmdbId), season, episode });
    if (existing && new Date(doc.updatedAt) < existing.updatedAt) return res.json(existing);
    const saved = await WatchProgress.findOneAndUpdate(
      { userId: req.userId, mediaType, tmdbId: String(tmdbId), season, episode },
      { ...doc, userId: req.userId },
      { upsert: true, new: true }
    );
    return res.json(saved);
  }

  res.json(memProgress.upsert(req.userId, doc));
});

router.get('/:mediaType/:tmdbId', async (req, res) => {
  const { mediaType, tmdbId } = req.params;
  const season = req.query.season ? Number(req.query.season) : null;
  const episode = req.query.episode ? Number(req.query.episode) : null;

  if (dbReady) {
    const doc = await WatchProgress.findOne({ userId: req.userId, mediaType, tmdbId, season, episode }).lean();
    return res.json(doc || null);
  }
  res.json(memProgress.get(req.userId, mediaType, tmdbId, season, episode));
});

export default router;
