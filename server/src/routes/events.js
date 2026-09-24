import { Router } from 'express';
import Event from '../models/Event.js';
import { dbReady } from '../services/db.js';
import { memEvents } from '../services/memoryStore.js';

const router = Router();

router.post('/', async (req, res) => {
  const { event, mediaType, tmdbId, meta } = req.body || {};
  if (!event || typeof event !== 'string') return res.status(400).json({ error: 'event_required' });

  const doc = { userId: req.userId, event, mediaType: mediaType || null, tmdbId: tmdbId ? String(tmdbId) : null, meta: meta || null, createdAt: new Date() };
  if (dbReady) await Event.create(doc);
  else memEvents.add(doc);

  res.status(204).end();
});

export default router;
