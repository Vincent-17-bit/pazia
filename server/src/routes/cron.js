import { Router } from 'express';
import { cronAuth } from '../middleware/cronAuth.js';
import { dbReady } from '../services/db.js';
import { runIngestTick } from '../services/ingest/runner.js';

const router = Router();

router.all('/ingest', cronAuth, async (req, res) => {
  if (!dbReady) return res.status(409).json({ error: 'database_required' });
  try {
    const summary = await runIngestTick();
    res.json(summary);
  } catch (err) {
    res.status(502).json({ error: 'ingest_tick_failed', message: err.message });
  }
});

export default router;
