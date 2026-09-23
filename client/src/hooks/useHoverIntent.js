import { useRef, useState, useCallback } from 'react';

const supportsHover =
  typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

export function useHoverIntent(delay = 500) {
  const [active, setActive] = useState(false);
  const timerRef = useRef(null);

  const onEnter = useCallback(() => {
    if (!supportsHover) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActive(true), delay);
  }, [delay]);

  const onLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    setActive(false);
  }, []);

  return { active, onEnter, onLeave, supportsHover };
}
