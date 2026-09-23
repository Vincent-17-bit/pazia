export default function SubtitleOverlay({ text, controlsVisible }) {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div
      className={`absolute left-0 right-0 flex justify-center px-6 pointer-events-none transition-[bottom] duration-200 ${controlsVisible ? 'bottom-28 md:bottom-32' : 'bottom-10'}`}
    >
      {/* window: box behind the whole caption region */}
      <div
        className="px-3 py-2 rounded-sm max-w-[90%]"
        style={{ background: `color-mix(in srgb, var(--sub-window) calc(var(--sub-window-opacity) * 100%), transparent)` }}
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className="text-center leading-snug inline-block px-1.5 py-0.5 rounded-[2px]"
            style={{
              fontFamily: 'var(--sub-font)',
              fontSize: 'calc(1rem * var(--sub-size) / 100%)',
              color: `color-mix(in srgb, var(--sub-color) calc(var(--sub-color-opacity) * 100%), transparent)`,
              textShadow: 'var(--sub-edge-shadow)',
              background: `color-mix(in srgb, var(--sub-bg) calc(var(--sub-bg-opacity) * 100%), transparent)`,
              display: 'block',
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
