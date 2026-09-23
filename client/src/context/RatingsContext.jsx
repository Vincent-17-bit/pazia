import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';

const RatingsContext = createContext(null);

function keyOf(mediaType, tmdbId) {
  return `${mediaType}:${tmdbId}`;
}

export function RatingsProvider({ children }) {
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    api
      .ratings()
      .then((res) => {
        const map = {};
        for (const r of res.items || []) map[keyOf(r.mediaType, r.tmdbId)] = r.value;
        setRatings(map);
      })
      .catch(() => {});
  }, []);

  const get = useCallback((mediaType, tmdbId) => ratings[keyOf(mediaType, tmdbId)] || null, [ratings]);

  const rate = useCallback(
    async (mediaType, tmdbId, value) => {
      const id = String(tmdbId);
      const k = keyOf(mediaType, id);
      const current = ratings[k] || null;
      const next = current === value ? null : value;

      setRatings((prev) => {
        const copy = { ...prev };
        if (next) copy[k] = next;
        else delete copy[k];
        return copy;
      });

      try {
        if (next) await api.setRating(mediaType, id, next);
        else await api.removeRating(mediaType, id);
      } catch {
        /* optimistic state kept; will reconcile on next load */
      }
      return next;
    },
    [ratings]
  );

  return <RatingsContext.Provider value={{ get, rate }}>{children}</RatingsContext.Provider>;
}

export function useRatings() {
  const ctx = useContext(RatingsContext);
  if (!ctx) throw new Error('useRatings must be used within RatingsProvider');
  return ctx;
}
