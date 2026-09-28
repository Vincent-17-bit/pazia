import { useRef, useState, useCallback, useEffect, cloneElement } from 'react';
import { createPortal } from 'react-dom';

const supportsHover =
  typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

const LONG_PRESS_MS = 450;
const TOUCH_STYLE = { WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' };

function frameOf(el) {
  const r = el.getBoundingClientRect();
  const root = el.closest('[data-tooltip-root]');
  if (!root) return { root: null, l: r.left, t: r.top, r: r.right, b: r.bottom, w: window.innerWidth, h: window.innerHeight };
  const rr = root.getBoundingClientRect();
  if (root.dataset.tooltipRoot === 'rotated') {
    return { root, l: r.top - rr.top, t: rr.right - r.right, r: r.bottom - rr.top, b: rr.right - r.left, w: rr.height, h: rr.width };
  }
  return { root, l: r.left - rr.left, t: r.top - rr.top, r: r.right - rr.left, b: r.bottom - rr.top, w: rr.width, h: rr.height };
}

export default function Tooltip({ label, delay = 450, children }) {
  const [tip, setTip] = useState(null);
  const triggerRef = useRef(null);
  const timerRef = useRef(null);
  const hideRef = useRef(null);
  const pressRef = useRef({ fired: false, x: 0, y: 0 });

  const place = useCallback((preferAbove) => {
    const el = triggerRef.current;
    if (!el) return;
    const f = frameOf(el);
    const estWidth = Math.max(48, label.length * 6.5 + 16);
    let left = f.l;
    if (left + estWidth > f.w - 8) left = f.r - estWidth;
    if (left < 8) left = 8;
    const fitsBelow = f.b + 34 <= f.h - 8;
    const fitsAbove = f.t - 34 >= 8;
    const below = preferAbove ? !fitsAbove && fitsBelow : fitsBelow;
    setTip({
      host: f.root,
      style: below ? { left, top: f.b + 8 } : { left, bottom: f.h - f.t + 8 },
    });
  }, [label]);

  const show = useCallback((withDelay) => {
    if (!supportsHover) return;
    clearTimeout(timerRef.current);
    if (withDelay) timerRef.current = setTimeout(() => place(false), delay);
    else place(false);
  }, [delay, place]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(hideRef.current);
    setTip(null);
  }, []);

  useEffect(() => () => {
    clearTimeout(timerRef.current);
    clearTimeout(hideRef.current);
  }, []);

  function blockNextClick() {
    function block(e) {
      e.stopPropagation();
      e.preventDefault();
    }
    window.addEventListener('click', block, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', block, { capture: true }), 700);
  }

  function endPress() {
    clearTimeout(timerRef.current);
    if (pressRef.current.fired) {
      pressRef.current.fired = false;
      blockNextClick();
      clearTimeout(hideRef.current);
      hideRef.current = setTimeout(hide, 1500);
    }
  }

  const p = children.props;

  return (
    <>
      {cloneElement(children, {
        ref: triggerRef,
        style: supportsHover ? p.style : { ...p.style, ...TOUCH_STYLE },
        onMouseEnter: (e) => { p.onMouseEnter?.(e); show(true); },
        onMouseLeave: (e) => { p.onMouseLeave?.(e); hide(); },
        onFocus: (e) => { p.onFocus?.(e); show(false); },
        onBlur: (e) => { p.onBlur?.(e); hide(); },
        onTouchStart: (e) => {
          p.onTouchStart?.(e);
          if (supportsHover || !e.touches[0]) return;
          clearTimeout(hideRef.current);
          pressRef.current = { fired: false, x: e.touches[0].clientX, y: e.touches[0].clientY };
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            pressRef.current.fired = true;
            place(true);
          }, LONG_PRESS_MS);
        },
        onTouchMove: (e) => {
          p.onTouchMove?.(e);
          if (supportsHover || !e.touches[0]) return;
          const dx = e.touches[0].clientX - pressRef.current.x;
          const dy = e.touches[0].clientY - pressRef.current.y;
          if (Math.hypot(dx, dy) > 10) clearTimeout(timerRef.current);
        },
        onTouchEnd: (e) => { p.onTouchEnd?.(e); if (!supportsHover) endPress(); },
        onTouchCancel: (e) => {
          p.onTouchCancel?.(e);
          if (supportsHover) return;
          pressRef.current.fired = false;
          hide();
        },
        onContextMenu: (e) => {
          p.onContextMenu?.(e);
          if (!supportsHover) e.preventDefault();
        },
      })}
      {tip && createPortal(
        <span
          role="tooltip"
          className={`${tip.host ? 'absolute' : 'fixed'} z-[9999] pointer-events-none whitespace-nowrap rounded px-2 py-1 text-[12px] text-white animate-tooltip-in`}
          style={{ ...tip.style, background: 'rgba(0,0,0,0.8)' }}
        >
          {label}
        </span>,
        tip.host || document.body
      )}
    </>
  );
}
