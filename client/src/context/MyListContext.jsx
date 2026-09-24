import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../lib/api.js';
import { useToast } from './ToastContext.jsx';

const MyListContext = createContext(null);
const LS_KEY = 'pazia:myList';
const DEBOUNCE_MS = 500;

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
function keyOf(mediaType, tmdbId) {
  return `${mediaType}:${tmdbId}`;
}

export function MyListProvider({ children }) {
  const [items, setItems] = useState(readLocal);
  const [synced, setSynced] = useState(false);
  const [pendingTick, setPendingTick] = useState(0);
  const pendingRef = useRef({});
  const { showToast } = useToast();

  // one-time reconcile: remote is the base, any local-only entries (added while
  // offline / before this device had synced) get pushed up too. There's no
  // login/session boundary in this app yet — every client is identified by the
  // persistent guest id already used across watchlist/ratings/history, so this
  // runs once on load rather than on a distinct "login" event. See MyList.jsx
  // for how the page waits on `synced` so nothing appears to vanish.
  useEffect(() => {
    api
      .watchlist()
      .then(async (res) => {
        const remote = res.items || [];
        const local = readLocal();
        const missing = local.filter(
          (l) => !remote.some((r) => r.mediaType === l.mediaType && r.tmdbId === l.tmdbId)
        );
        await Promise.all(missing.map((l) => api.addToWatchlist(l.mediaType, l.tmdbId).catch(() => {})));
        const merged = [...remote, ...missing].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
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

  const isPending = useCallback(
    (mediaType, tmdbId) => !!pendingRef.current[keyOf(mediaType, String(tmdbId))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingTick]
  );

  const toggle = useCallback(
    async (mediaType, tmdbId, opts = {}) => {
      const id = String(tmdbId);
      const k = keyOf(mediaType, id);
      if (pendingRef.current[k]) return; // rapid double-click guard

      pendingRef.current[k] = true;
      setPendingTick((t) => t + 1);
      setTimeout(() => {
        delete pendingRef.current[k];
        setPendingTick((t) => t + 1);
      }, DEBOUNCE_MS);

      let prevItems;
      let exists;
      setItems((cur) => {
        prevItems = cur;
        exists = cur.some((i) => i.mediaType === mediaType && i.tmdbId === id);
        const next = exists
          ? cur.filter((i) => !(i.mediaType === mediaType && i.tmdbId === id))
          : [{ mediaType, tmdbId: id, addedAt: new Date().toISOString() }, ...cur];
        writeLocal(next);
        return next;
      });

      try {
        if (exists) await api.removeFromWatchlist(mediaType, id);
        else await api.addToWatchlist(mediaType, id);
        if (!opts.silent) {
          showToast({
            message: exists ? 'Removed from My List' : 'Added to My List',
            actionLabel: 'Undo',
            onAction: () => toggle(mediaType, id, { silent: true }),
          });
        }
      } catch {
        setItems(prevItems);
        writeLocal(prevItems);
        showToast({ message: "Couldn't update My List — try again." });
      }
    },
    [showToast]
  );

  return (
    <MyListContext.Provider value={{ items, has, toggle, isPending, synced }}>
      {children}
    </MyListContext.Provider>
  );
}

export function useMyList() {
  const ctx = useContext(MyListContext);
  if (!ctx) throw new Error('useMyList must be used within MyListProvider');
  return ctx;
}
