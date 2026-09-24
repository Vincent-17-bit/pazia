const progress = new Map();
const watchlist = new Map();
const history = new Map();
const ratings = new Map();
const contentSources = new Map();
const events = [];

function key(mediaType, tmdbId, season, episode) {
  return [mediaType, tmdbId, season ?? '', episode ?? ''].join(':');
}

export const memProgress = {
  upsert(userId, doc) {
    const k = `${userId}::${key(doc.mediaType, doc.tmdbId, doc.season, doc.episode)}`;
    const existing = progress.get(k);
    if (existing && doc.updatedAt < existing.updatedAt) return existing;
    const merged = { ...existing, ...doc, updatedAt: doc.updatedAt || Date.now() };
    progress.set(k, merged);
    return merged;
  },
  get(userId, mediaType, tmdbId, season, episode) {
    return progress.get(`${userId}::${key(mediaType, tmdbId, season, episode)}`) || null;
  },
  allForUser(userId) {
    return [...progress.entries()]
      .filter(([k]) => k.startsWith(`${userId}::`))
      .map(([, v]) => v)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
  remove(userId, mediaType, tmdbId) {
    for (const k of [...progress.keys()]) {
      if (k.startsWith(`${userId}::${mediaType}:${tmdbId}`)) progress.delete(k);
    }
  },
};

export const memWatchlist = {
  add(userId, mediaType, tmdbId) {
    const k = `${userId}::${mediaType}:${tmdbId}`;
    if (!watchlist.has(k)) watchlist.set(k, { userId, mediaType, tmdbId, addedAt: Date.now() });
    return watchlist.get(k);
  },
  remove(userId, mediaType, tmdbId) {
    watchlist.delete(`${userId}::${mediaType}:${tmdbId}`);
  },
  list(userId) {
    return [...watchlist.values()].filter((w) => w.userId === userId).sort((a, b) => b.addedAt - a.addedAt);
  },
};

export const memHistory = {
  add(userId, entry) {
    const list = history.get(userId) || [];
    list.unshift({ ...entry, watchedAt: Date.now() });
    history.set(userId, list.slice(0, 500));
  },
  list(userId) {
    return history.get(userId) || [];
  },
};

export const memRatings = {
  set(userId, mediaType, tmdbId, value) {
    const k = `${userId}::${mediaType}:${tmdbId}`;
    const doc = { userId, mediaType, tmdbId, value, createdAt: Date.now() };
    ratings.set(k, doc);
    return doc;
  },
  remove(userId, mediaType, tmdbId) {
    ratings.delete(`${userId}::${mediaType}:${tmdbId}`);
  },
  list(userId) {
    return [...ratings.values()].filter((r) => r.userId === userId);
  },
};

export const memEvents = {
  add(doc) {
    events.push(doc);
    if (events.length > 5000) events.shift();
  },
};

export const memContentSources = {
  seedDemo() {
    contentSources.set('movie:watu-wote::', {
      mediaType: 'movie',
      tmdbId: 'watu-wote',
      provider: 'archiveorg',
      type: 'mp4',
      url: 'https://ia802606.us.archive.org/7/items/night_of_the_living_dead/night_of_the_living_dead_512kb.mp4',
      license: 'public-domain',
    });
  },
  find(mediaType, tmdbId, season, episode) {
    return contentSources.get(key(mediaType, tmdbId, season, episode)) || null;
  },
};
memContentSources.seedDemo();
