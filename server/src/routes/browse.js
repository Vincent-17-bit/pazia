import { Router } from 'express';
import { getTabItems } from '../services/catalog.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const tab = req.query.tab || 'home';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const items = await getTabItems(tab, page);
    res.json({ tab, page, items });
  } catch (err) {
    res.status(502).json({ error: 'browse_failed', message: err.message });
  }
});

export default router;
