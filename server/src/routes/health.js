import { Router } from 'express';
import { hasTmdbKey } from '../services/tmdb.js';
import { dbReady } from '../services/db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ ok: true, tmdb: hasTmdbKey(), db: dbReady, time: new Date().toISOString() });
});

export default router;
