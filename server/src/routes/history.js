import { Router } from 'express';
import HistoryEntry from '../models/HistoryEntry.js';
import WatchProgress from '../models/WatchProgress.js';
import { dbReady } from '../services/db.js';
import { memHistory, memProgress } from '../services/memoryStore.js';

const router = Router();

router.get('/', async (req, res) => {
  if (dbReady) {
    const list = await HistoryEntry.find({ userId: req.userId }).sort({ watchedAt: -1 }).limit(200).lean();
    return res.json({ items: list });
  }
  res.json({ items: memHistory.list(req.userId) });
});

router.delete('/:mediaType/:tmdbId', async (req, res) => {
  const { mediaType, tmdbId } = req.params;
  if (dbReady) {
    await WatchProgress.deleteMany({ userId: req.userId, mediaType, tmdbId });
    return res.json({ ok: true });
  }
  memProgress.remove(req.userId, mediaType, tmdbId);
  res.json({ ok: true });
});

export default router;
