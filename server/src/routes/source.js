import { Router } from 'express';
import { resolveSource } from '../providers/index.js';

const router = Router();

router.get('/:mediaType/:id', async (req, res) => {
  const { mediaType, id } = req.params;
  const season = req.query.season ? Number(req.query.season) : null;
  const episode = req.query.episode ? Number(req.query.episode) : null;

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
