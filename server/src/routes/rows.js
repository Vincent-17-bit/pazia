import { Router } from 'express';
import { getRowItems } from '../services/catalog.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const keysParam = (req.query.keys || '').toString();
    const keys = keysParam.split(',').map((k) => k.trim()).filter(Boolean);
    const results = await Promise.all(
      keys.map(async (key) => ({ key, items: await getRowItems(key) }))
    );
    res.json({ rows: results });
  } catch (err) {
    res.status(502).json({ error: 'rows_failed', message: err.message });
  }
});

export default router;
