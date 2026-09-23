const BASE = import.meta.env.VITE_API_BASE || '/api';

function getGuestId() {
  let id = localStorage.getItem('pazia:guestId');
  if (!id) {
    id = 'guest-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('pazia:guestId', id);
  }
  return id;
}

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Guest-Id': getGuestId(),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || body.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.json();
}

export const api = {
  health: () => request('/health'),
  hero: (tab) => request(`/hero?tab=${encodeURIComponent(tab)}`),
  browse: (tab, page = 1) => request(`/browse?tab=${encodeURIComponent(tab)}&page=${page}`),
  rows: (keys) => request(`/rows?keys=${encodeURIComponent(keys.join(','))}`),
  externalRows: (keys) => request(`/external/rows?keys=${encodeURIComponent(keys.join(','))}`),
  search: (params) => request(`/search?${new URLSearchParams(params).toString()}`),
  title: (mediaType, id) => request(`/title/${mediaType}/${id}`),
  season: (id, seasonNumber, page = 1) => request(`/title/tv/${id}/season/${seasonNumber}?page=${page}`),
  source: (mediaType, id, season, episode) => {
    const qs = new URLSearchParams();
    if (season != null) qs.set('season', season);
    if (episode != null) qs.set('episode', episode);
    return request(`/source/${mediaType}/${id}?${qs.toString()}`);
  },
  getProgress: (mediaType, id, season, episode) => {
    const qs = new URLSearchParams();
    if (season != null) qs.set('season', season);
    if (episode != null) qs.set('episode', episode);
    return request(`/progress/${mediaType}/${id}?${qs.toString()}`);
  },
  putProgress: (body, keepalive = false) => request('/progress', { method: 'PUT', body: JSON.stringify(body), keepalive }),
  continueWatching: () => request('/continue-watching'),
  watchlist: () => request('/watchlist'),
  addToWatchlist: (mediaType, tmdbId) => request('/watchlist', { method: 'POST', body: JSON.stringify({ mediaType, tmdbId }) }),
  removeFromWatchlist: (mediaType, tmdbId) => request(`/watchlist/${mediaType}/${tmdbId}`, { method: 'DELETE' }),
  ratings: () => request('/ratings'),
  setRating: (mediaType, tmdbId, value) => request('/ratings', { method: 'POST', body: JSON.stringify({ mediaType, tmdbId, value }) }),
  removeRating: (mediaType, tmdbId) => request(`/ratings/${mediaType}/${tmdbId}`, { method: 'DELETE' }),
  history: () => request('/history'),
  removeFromHistory: (mediaType, tmdbId) => request(`/history/${mediaType}/${tmdbId}`, { method: 'DELETE' }),
};

export { getGuestId };
