export function resolveUserId(req, res, next) {
  const fromHeader = req.get('X-Guest-Id');
  req.userId = fromHeader || 'anonymous';
  next();
}
