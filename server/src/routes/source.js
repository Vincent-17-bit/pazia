import { Router } from 'express';
import { resolveSource } from '../providers/index.js';
import { getExternalItem } from '../services/externalCatalog.js';
import { resolvePlayback } from '../services/external/index.js';

const router = Router();

router.get('/:mediaType/:id', async (req, res) => {
  const { mediaType, id } = req.params;
  const season = req.query.season ? Number(req.query.season) : null;
  const episode = req.query.episode ? Number(req.query.episode) : null;

  if (mediaType === 'external') {
    const [source, refId] = id.split(':');
    try {
      const item = await getExternalItem(source, refId);
      const playback = item?.playback || (await resolvePlayback(source, refId));
      if (!playback) return res.status(404).json({ error: 'no_licensed_source', hint: 'No playback source available for this title yet.' });
      return res.json(playback);
    } catch (err) {
      return res.status(502).json({ error: 'external_source_failed', message: err.message });
    }
  }

  const source = await resolveSource(mediaType, id, season, episode);
  if (!source) {
    return res.status(404).json({
      error: 'no_licensed_source',
      hint: 'This title has no available playback source yet. Check "Where to watch" for official providers.',
    });
  }
  res.json(source);
});

export default router;
