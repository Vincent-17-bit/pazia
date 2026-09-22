import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';

const MyListContext = createContext(null);
const LS_KEY = 'pazia:myList';

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || [];
  } catch {
    return [];
  }
}
function writeLocal(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function MyListProvider({ children }) {
  const [items, setItems] = useState(readLocal);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    api
      .watchlist()
      .then((res) => {
        const remote = res.items || [];
        const local = readLocal();
        const merged = [...remote];
        for (const l of local) {
          if (!merged.some((r) => r.mediaType === l.mediaType && r.tmdbId === l.tmdbId)) {
            merged.push(l);
            api.addToWatchlist(l.mediaType, l.tmdbId).catch(() => {});
          }
        }
        setItems(merged);
        writeLocal(merged);
        setSynced(true);
      })
      .catch(() => setSynced(true));
  }, []);

  const has = useCallback(
    (mediaType, tmdbId) => items.some((i) => i.mediaType === mediaType && i.tmdbId === String(tmdbId)),
    [items]
  );

  const toggle = useCallback(
    async (mediaType, tmdbId) => {
      const id = String(tmdbId);
      const exists = items.some((i) => i.mediaType === mediaType && i.tmdbId === id);
      const next = exists
        ? items.filter((i) => !(i.mediaType === mediaType && i.tmdbId === id))
        : [...items, { mediaType, tmdbId: id, addedAt: Date.now() }];
      setItems(next);
      writeLocal(next);
      try {
        if (exists) await api.removeFromWatchlist(mediaType, id);
        else await api.addToWatchlist(mediaType, id);
      } catch {
        /* offline: local state already updated, API will retry on next sync */
      }
    },
    [items]
  );

  return (
    <MyListContext.Provider value={{ items, has, toggle, synced }}>
      {children}
    </MyListContext.Provider>
  );
}

export function useMyList() {
  const ctx = useContext(MyListContext);
  if (!ctx) throw new Error('useMyList must be used within MyListProvider');
  return ctx;
}
