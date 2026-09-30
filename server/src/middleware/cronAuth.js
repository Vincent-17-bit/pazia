export function cronAuth(req, res, next) {
  const configured = process.env.CRON_SECRET;
  if (!configured) return res.status(403).json({ error: 'cron_disabled', hint: 'Set CRON_SECRET to enable the ingestion cron endpoint.' });
  const provided = req.get('X-Cron-Secret') || req.query.secret;
  if (provided !== configured) return res.status(401).json({ error: 'unauthorized' });
  next();
}
