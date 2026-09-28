import { useCallback, useEffect, useRef, useState } from 'react';

const KEY = 'netstreamz:player-orientation';

function query(q) {
  return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q) : null;
}

function readEnv() {
  return {
    coarse: !!query('(pointer: coarse)')?.matches,
    landscape: !!query('(orientation: landscape)')?.matches,
    w: window.innerWidth,
    h: window.innerHeight,
  };
}

function readIntent() {
  try { return sessionStorage.getItem(KEY) === 'forced'; } catch { return false; }
}

function writeIntent(on) {
  try { on ? sessionStorage.setItem(KEY, 'forced') : sessionStorage.removeItem(KEY); } catch {}
}

export function useOrientation(containerRef) {
  const [env, setEnv] = useState(readEnv);
  const intentRef = useRef(null);
  if (intentRef.current === null) intentRef.current = readIntent() && env.coarse;
  const [mode, setModeState] = useState(() => (intentRef.current && !env.landscape ? 'forced' : 'portrait'));
  const modeRef = useRef(mode);
  const enteredFsRef = useRef(false);
  const busyRef = useRef(false);

  const setMode = useCallback((m) => {
    modeRef.current = m;
    setModeState(m);
  }, []);

  const setIntent = useCallback((on) => {
    intentRef.current = on;
    writeIntent(on);
  }, []);

  useEffect(() => {
    function sync() {
      const next = readEnv();
      setEnv((p) => (p.coarse === next.coarse && p.landscape === next.landscape && p.w === next.w && p.h === next.h ? p : next));
    }
    const mqLandscape = query('(orientation: landscape)');
    const mqCoarse = query('(pointer: coarse)');
    mqLandscape?.addEventListener?.('change', sync);
    mqCoarse?.addEventListener?.('change', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    screen.orientation?.addEventListener?.('change', sync);
    return () => {
      mqLandscape?.removeEventListener?.('change', sync);
      mqCoarse?.removeEventListener?.('change', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      screen.orientation?.removeEventListener?.('change', sync);
    };
  }, []);

  useEffect(() => {
    if (mode === 'forced' && env.landscape) setMode('portrait');
    else if (mode === 'portrait' && !env.landscape && env.coarse && intentRef.current) setMode('forced');
  }, [mode, env.landscape, env.coarse, setMode]);

  useEffect(() => {
    function onFullscreenChange() {
      if (document.fullscreenElement || modeRef.current !== 'locked') return;
      try { screen.orientation.unlock(); } catch {}
      enteredFsRef.current = false;
      setIntent(false);
      setMode('portrait');
    }
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [setIntent, setMode]);

  useEffect(() => () => {
    if (modeRef.current === 'locked') {
      try { screen.orientation.unlock(); } catch {}
    }
    if (enteredFsRef.current && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }, []);

  const exit = useCallback(() => {
    if (modeRef.current === 'locked') {
      try { screen.orientation.unlock(); } catch {}
    }
    if (enteredFsRef.current && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    enteredFsRef.current = false;
    setIntent(false);
    setMode('portrait');
  }, [setIntent, setMode]);

  const enter = useCallback(async () => {
    busyRef.current = true;
    const el = containerRef.current;
    const canLock = typeof screen.orientation?.lock === 'function';
    let locked = false;
    if (canLock && el?.requestFullscreen) {
      try {
        if (!document.fullscreenElement) {
          enteredFsRef.current = true;
          await el.requestFullscreen();
        }
        await screen.orientation.lock('landscape');
        locked = true;
      } catch {
        try { screen.orientation.unlock(); } catch {}
      }
    }
    if (locked) {
      setMode('locked');
    } else {
      if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch {}
      }
      enteredFsRef.current = false;
      setIntent(true);
      setMode('forced');
    }
    busyRef.current = false;
  }, [containerRef, setIntent, setMode]);

  const toggle = useCallback(() => {
    if (busyRef.current) return;
    if (modeRef.current !== 'portrait') exit();
    else enter();
  }, [enter, exit]);

  const isLandscape = mode === 'forced' || env.landscape;
  const available = env.coarse && (mode !== 'portrait' || !env.landscape);
  const short = isLandscape && (mode === 'forced' ? env.w : env.h) <= 420;

  return { supported: env.coarse, available, isLandscape, mode, short, toggle };
}
