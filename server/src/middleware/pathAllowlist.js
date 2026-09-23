const ALLOWED_PREFIXES = ['/api/health', '/api/hero', '/api/browse', '/api/rows', '/api/search', '/api/title', '/api/source', '/api/progress', '/api/watchlist', '/api/ratings', '/api/history', '/api/continue-watching', '/api/external'];

export function pathAllowlist(req, res, next) {
  const ok = ALLOWED_PREFIXES.some((p) => req.originalUrl.startsWith(p));
  if (!ok) return res.status(404).json({ error: 'not_found' });
  next();
}
