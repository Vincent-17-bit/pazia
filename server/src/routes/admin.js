import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { dbReady } from '../services/db.js';
import ExternalTitle from '../models/ExternalTitle.js';
import IngestChannel from '../models/IngestChannel.js';
import IngestCollection from '../models/IngestCollection.js';
import IngestRejection from '../models/IngestRejection.js';
import IngestBlock from '../models/IngestBlock.js';
import IngestState from '../models/IngestState.js';
import { runIngestTick } from '../services/ingest/runner.js';

const router = Router();
router.use(adminAuth);

function requireDb(req, res, next) {
  if (!dbReady) return res.status(409).json({ error: 'database_required', hint: 'Ingestion needs MONGODB_URI configured.' });
  next();
}
router.use(requireDb);

// ---- titles ----
router.get('/titles', async (req, res) => {
  const { status, source, q, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (q) filter.title = { $regex: String(q), $options: 'i' };
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    ExternalTitle.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    ExternalTitle.countDocuments(filter),
  ]);
  res.json({ items, total, page: Number(page), limit: Number(limit) });
});

router.post('/titles', async (req, res) => {
  const body = req.body || {};
  const required = ['source', 'sourceId', 'title', 'runtimeMinutes', 'license', 'playback'];
  const missing = required.filter((f) => body[f] == null);
  if (missing.length) return res.status(400).json({ error: 'missing_fields', missing });
  const doc = await ExternalTitle.findOneAndUpdate(
    { source: body.source, sourceId: String(body.sourceId), season: body.season ?? null, episode: body.episode ?? null },
    { ...body, sourceId: String(body.sourceId), addedManually: true, lastRefreshedAt: new Date(), status: body.status || 'active' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(201).json(doc);
});

router.patch('/titles/:id', async (req, res) => {
  const doc = await ExternalTitle.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
  if (!doc) return res.status(404).json({ error: 'not_found' });
  res.json(doc);
});

router.delete('/titles/:id', async (req, res) => {
  await ExternalTitle.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

router.post('/titles/:id/block', async (req, res) => {
  const doc = await ExternalTitle.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: 'not_found' });
  await IngestBlock.findOneAndUpdate(
    { source: doc.source, sourceId: doc.sourceId },
    { source: doc.source, sourceId: doc.sourceId, reason: req.body?.reason || null },
    { upsert: true }
  );
  doc.status = 'blocked';
  doc.statusReason = req.body?.reason || 'blocked_by_admin';
  await doc.save();
  res.json(doc);
});

// ---- channels ----
router.get('/channels', async (req, res) => res.json({ items: await IngestChannel.find().sort({ _id: -1 }).lean() }));
router.post('/channels', async (req, res) => {
  const { handle, channelId, label, categories = [], isKids = false } = req.body || {};
  if (!label || (!handle && !channelId)) return res.status(400).json({ error: 'missing_fields' });
  const doc = await IngestChannel.create({ handle, channelId, label, categories, isKids, active: true });
  res.status(201).json(doc);
});
router.patch('/channels/:id', async (req, res) => {
  const doc = await IngestChannel.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
  if (!doc) return res.status(404).json({ error: 'not_found' });
  res.json(doc);
});
router.delete('/channels/:id', async (req, res) => {
  await IngestChannel.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ---- collections ----
router.get('/collections', async (req, res) => res.json({ items: await IngestCollection.find().sort({ _id: -1 }).lean() }));
router.post('/collections', async (req, res) => {
  const { collection, subjectFilter = null, category } = req.body || {};
  if (!collection || !category) return res.status(400).json({ error: 'missing_fields' });
  const doc = await IngestCollection.create({ collection, subjectFilter, category, active: true });
  res.status(201).json(doc);
});
router.patch('/collections/:id', async (req, res) => {
  const doc = await IngestCollection.findByIdAndUpdate(req.params.id, req.body || {}, { new: true });
  if (!doc) return res.status(404).json({ error: 'not_found' });
  res.json(doc);
});
router.delete('/collections/:id', async (req, res) => {
  await IngestCollection.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ---- rejections / status ----
router.get('/rejections', async (req, res) => {
  const { source, reason, page = 1, limit = 100 } = req.query;
  const filter = {};
  if (source) filter.source = source;
  if (reason) filter.reason = reason;
  const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    IngestRejection.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    IngestRejection.countDocuments(filter),
  ]);
  res.json({ items, total });
});

router.get('/status', async (req, res) => {
  const [states, titleCount, activeCount, rejectionCount] = await Promise.all([
    IngestState.find().lean(),
    ExternalTitle.countDocuments(),
    ExternalTitle.countDocuments({ status: 'active' }),
    IngestRejection.countDocuments(),
  ]);
  res.json({ states, titleCount, activeCount, rejectionCount });
});

router.post('/run', async (req, res) => {
  try {
    const summary = await runIngestTick();
    res.json(summary);
  } catch (err) {
    res.status(502).json({ error: 'ingest_tick_failed', message: err.message });
  }
});

export default router;
