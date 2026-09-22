const store = new Map();

export function cacheGet(key) {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function cacheSet(key, value, ttlMs) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

export function cached(key, ttlMs, fn) {
  const hit = cacheGet(key);
  if (hit) return Promise.resolve(hit);
  return fn().then((value) => {
    cacheSet(key, value, ttlMs);
    return value;
  });
}
