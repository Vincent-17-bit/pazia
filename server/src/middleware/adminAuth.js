// Simple shared-secret auth for the admin API - there's no user account
// system on this site, so a single operator token (set via ADMIN_TOKEN)
// gates every /api/admin route. If the token isn't configured, admin
// routes are disabled entirely rather than left open.
export function adminAuth(req, res, next) {
  const configured = process.env.ADMIN_TOKEN;
  if (!configured) return res.status(403).json({ error: 'admin_disabled', hint: 'Set ADMIN_TOKEN to enable the admin API.' });
  const provided = req.get('X-Admin-Token');
  if (provided !== configured) return res.status(401).json({ error: 'unauthorized' });
  next();
}
