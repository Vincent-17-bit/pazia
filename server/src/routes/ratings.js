import { Router } from 'express';
import Rating from '../models/Rating.js';
import { dbReady } from '../services/db.js';
import { memRatings } from '../services/memoryStore.js';

const router = Router();
const VALUES = ['up', 'down', 'love'];

router.get('/', async (req, res) => {
  if (dbReady) {
    const list = await Rating.find({ userId: req.userId }).lean();
    return res.json({ items: list });
  }
  res.json({ items: memRatings.list(req.userId) });
});

router.post('/', async (req, res) => {
  const { mediaType, tmdbId, value } = req.body || {};
  if (!mediaType || !tmdbId || !VALUES.includes(value)) {
    return res.status(400).json({ error: 'missing_or_invalid_fields' });
  }

  if (dbReady) {
    const doc = await Rating.findOneAndUpdate(
      { userId: req.userId, mediaType, tmdbId: String(tmdbId) },
      { userId: req.userId, mediaType, tmdbId: String(tmdbId), value },
      { upsert: true, new: true }
    );
    return res.json(doc);
  }
  res.json(memRatings.set(req.userId, mediaType, String(tmdbId), value));
});

router.delete('/:mediaType/:tmdbId', async (req, res) => {
  const { mediaType, tmdbId } = req.params;
  if (dbReady) {
    await Rating.deleteOne({ userId: req.userId, mediaType, tmdbId });
    return res.json({ ok: true });
  }
  memRatings.remove(req.userId, mediaType, tmdbId);
  res.json({ ok: true });
});

export default router;
