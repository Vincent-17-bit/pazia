import { Router } from 'express';
import { getTabItems } from '../services/catalog.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const tab = req.query.tab || 'home';
    const items = await getTabItems(tab);
    const pool = items.filter((i) => i.backdropPath !== null || !i.backdropPath === false).slice(0, 5);
    const source = pool.length ? pool : items.slice(0, 5);
    const pick = source[Math.floor(Math.random() * source.length)] || items[0] || null;
    res.json({ featured: pick, strip: items.slice(0, 15) });
  } catch (err) {
    res.status(502).json({ error: 'hero_failed', message: err.message });
  }
});

export default router;
