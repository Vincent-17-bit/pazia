import { useRef, useState, useCallback, cloneElement } from 'react';
import { createPortal } from 'react-dom';

const supportsHover =
  typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

// YouTube-style icon tooltip. Wraps a single focusable child, no markup per-button.
export default function Tooltip({ label, delay = 450, children }) {
  const [style, setStyle] = useState(null);
  const triggerRef = useRef(null);
  const timerRef = useRef(null);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const estWidth = Math.max(48, label.length * 6.5 + 16);
    let left = r.left;
    if (left + estWidth > window.innerWidth - 8) left = r.right - estWidth;
    if (left < 8) left = 8;

    const fitsBelow = r.bottom + 34 <= window.innerHeight - 8;
    setStyle(
      fitsBelow
        ? { left, top: r.bottom + 8 }
        : { left, bottom: window.innerHeight - r.top + 8 }
    );
  }, [label]);

  const show = useCallback((withDelay) => {
    if (!supportsHover) return;
    clearTimeout(timerRef.current);
    if (withDelay) timerRef.current = setTimeout(() => place(), delay);
    else place();
  }, [delay, place]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setStyle(null);
  }, []);

  return (
    <>
      {cloneElement(children, {
        ref: triggerRef,
        onMouseEnter: (e) => { children.props.onMouseEnter?.(e); show(true); },
        onMouseLeave: (e) => { children.props.onMouseLeave?.(e); hide(); },
        onFocus: (e) => { children.props.onFocus?.(e); show(false); },
        onBlur: (e) => { children.props.onBlur?.(e); hide(); },
      })}
      {style && createPortal(
        <span
          role="tooltip"
          className="fixed z-[9999] pointer-events-none whitespace-nowrap rounded px-2 py-1 text-[12px] text-white animate-tooltip-in"
          style={{ ...style, background: 'rgba(0,0,0,0.8)' }}
        >
          {label}
        </span>,
        document.body
      )}
    </>
  );
}
