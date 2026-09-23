import { useState, useRef } from 'react';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SWATCHES = ['#ffffff', '#ffee58', '#4dd0e1', '#81c784', '#000000'];

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-white/70">{label}</span>
      {children}
    </div>
  );
}

function Swatch({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-1.5">
      {SWATCHES.map((c) => (
        <button
          key={c}
          disabled={disabled}
          onClick={() => onChange(c)}
          aria-label={c}
          className={`w-5 h-5 rounded-full border ${value === c ? 'border-red' : 'border-white/30'} disabled:opacity-30`}
          style={{ background: c }}
        />
      ))}
      <input
        type="color"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 rounded-full bg-transparent disabled:opacity-30"
      />
    </div>
  );
}

export default function SettingsPanel({
  onClose,
  audioTracks, activeAudioTrack, onAudioChange,
  subtitleTracks, activeSubtitleLang, onSubtitleChange,
  subtitleSettings, updateSubtitleSettings, resetSubtitleSettings,
  rate, onRateChange,
  levels, activeLevel, onQualityChange,
  dataSaver, onDataSaverChange,
}) {
  const [toast, setToast] = useState(false);
  const sheetRef = useRef(null);
  const dragStartY = useRef(null);

  function handleReset() {
    resetSubtitleSettings();
    setToast(true);
    setTimeout(() => setToast(false), 1600);
  }

  function onTouchStart(e) {
    if (sheetRef.current.scrollTop === 0) dragStartY.current = e.touches[0].clientY;
  }
  function onTouchMove(e) {
    if (dragStartY.current == null) return;
    if (e.touches[0].clientY - dragStartY.current > 100) {
      dragStartY.current = null;
      onClose();
    }
  }

  const subtitleOn = activeSubtitleLang && activeSubtitleLang !== 'off';
  const s = subtitleSettings;

  return (
    <div
      className="absolute inset-0 z-30 flex md:justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        className="mt-auto md:mt-0 w-full md:w-[380px] md:h-full max-h-[85vh] md:max-h-none overflow-y-auto bg-surface rounded-t-2xl md:rounded-none border-t md:border-t-0 md:border-l border-line px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-3 md:pt-5"
      >
        <div className="md:hidden flex justify-center pb-2">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Settings</h3>
          <button onClick={onClose} aria-label="Close settings" className="w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none stroke-2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {audioTracks?.length > 1 && (
          <section className="border-b border-line py-2">
            <div className="text-xs uppercase tracking-wide text-white/40 mb-1.5">Audio</div>
            {audioTracks.map((t, i) => (
              <label key={i} className="flex items-center gap-2 py-1.5 text-sm">
                <input type="radio" name="audio" checked={activeAudioTrack === i} onChange={() => onAudioChange(i)} className="accent-red" />
                {t.name || t.lang}
              </label>
            ))}
          </section>
        )}

        <section className="border-b border-line py-2">
          <div className="text-xs uppercase tracking-wide text-white/40 mb-1.5">Subtitles</div>
          <label className="flex items-center gap-2 py-1.5 text-sm">
            <input type="radio" name="sub" checked={!subtitleOn} onChange={() => onSubtitleChange('off')} className="accent-red" />
            Off
          </label>
          {subtitleTracks?.map((t) => (
            <label key={t.lang} className="flex items-center gap-2 py-1.5 text-sm">
              <input type="radio" name="sub" checked={activeSubtitleLang === t.lang} onChange={() => onSubtitleChange(t.lang)} className="accent-red" />
              {t.lang}
            </label>
          ))}
        </section>

        <section className={`border-b border-line py-2 ${!subtitleOn ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className="text-xs uppercase tracking-wide text-white/40 mb-1.5">Subtitle Appearance</div>

          <div className="rounded-md bg-black/60 py-3 flex items-center justify-center mb-2">
            <span
              style={{
                fontFamily: { sans: "'Inter',sans-serif", serif: 'Georgia,serif', monospace: "'Courier New',monospace", casual: "'Comic Sans MS',cursive" }[s.fontFamily],
                fontSize: `${s.fontSize * 0.13}px`,
                color: s.fontColor,
                opacity: s.fontOpacity / 100,
                textShadow: { none: 'none', dropshadow: `1px 1px 2px ${s.edgeColor}`, raised: `-1px -1px 1px ${s.edgeColor}`, depressed: `1px 1px 1px ${s.edgeColor}`, outline: `1px 0 ${s.edgeColor},-1px 0 ${s.edgeColor},0 1px ${s.edgeColor},0 -1px ${s.edgeColor}` }[s.edgeStyle],
                background: s.bgColor + Math.round(s.bgOpacity * 2.55).toString(16).padStart(2, '0'),
                padding: '2px 6px',
              }}
            >
              This is how your subtitles will look
            </span>
          </div>

          <Row label="Font">
            <select value={s.fontFamily} onChange={(e) => updateSubtitleSettings({ fontFamily: e.target.value })} className="bg-surface2 text-xs rounded px-2 py-1 border border-line">
              <option value="sans">Sans</option>
              <option value="serif">Serif</option>
              <option value="monospace">Monospace</option>
              <option value="casual">Casual</option>
            </select>
          </Row>
          <Row label="Size">
            <input type="range" min={75} max={200} step={5} value={s.fontSize} onChange={(e) => updateSubtitleSettings({ fontSize: Number(e.target.value) })} className="w-28 accent-red" />
          </Row>
          <Row label="Color">
            <Swatch value={s.fontColor} onChange={(fontColor) => updateSubtitleSettings({ fontColor })} />
          </Row>
          <Row label="Opacity">
            <input type="range" min={0} max={100} value={s.fontOpacity} onChange={(e) => updateSubtitleSettings({ fontOpacity: Number(e.target.value) })} className="w-28 accent-red" />
          </Row>
          <Row label="Edge Style">
            <select value={s.edgeStyle} onChange={(e) => updateSubtitleSettings({ edgeStyle: e.target.value })} className="bg-surface2 text-xs rounded px-2 py-1 border border-line">
              <option value="none">None</option>
              <option value="dropshadow">Drop Shadow</option>
              <option value="raised">Raised</option>
              <option value="depressed">Depressed</option>
              <option value="outline">Outline</option>
            </select>
          </Row>
          <Row label="Edge Color">
            <Swatch value={s.edgeColor} disabled={s.edgeStyle === 'none'} onChange={(edgeColor) => updateSubtitleSettings({ edgeColor })} />
          </Row>
          <Row label="Line background">
            <Swatch value={s.bgColor} onChange={(bgColor) => updateSubtitleSettings({ bgColor })} />
          </Row>
          <Row label="Line bg opacity">
            <input type="range" min={0} max={100} value={s.bgOpacity} onChange={(e) => updateSubtitleSettings({ bgOpacity: Number(e.target.value) })} className="w-28 accent-red" />
          </Row>
          <Row label="Caption window">
            <Swatch value={s.windowColor} onChange={(windowColor) => updateSubtitleSettings({ windowColor })} />
          </Row>
          <Row label="Window opacity">
            <input type="range" min={0} max={100} value={s.windowOpacity} onChange={(e) => updateSubtitleSettings({ windowOpacity: Number(e.target.value) })} className="w-28 accent-red" />
          </Row>
          <p className="text-[11px] text-white/40 mt-1 mb-2 leading-snug">
            "Line background" hugs each line of text. "Caption window" shades the whole area behind all lines.
          </p>
          <button onClick={handleReset} className="text-xs border border-line rounded-md px-3 py-1.5 w-full">Reset to defaults</button>
          {toast && <div className="text-[11px] text-red mt-1.5 text-center">Subtitle style reset</div>}
        </section>

        <section className="border-b border-line py-2">
          <div className="text-xs uppercase tracking-wide text-white/40 mb-1.5">Playback Speed</div>
          <div className="flex flex-wrap gap-1.5">
            {SPEEDS.map((r) => (
              <button
                key={r}
                onClick={() => onRateChange(r)}
                className={`text-xs px-2.5 py-1 rounded-full border ${rate === r ? 'border-red text-red' : 'border-line text-white/70'}`}
              >
                {r}×
              </button>
            ))}
          </div>
        </section>

        {levels?.length > 0 && (
          <section className="py-2">
            <div className="text-xs uppercase tracking-wide text-white/40 mb-1.5">Quality</div>
            <label className="flex items-center gap-2 py-1 text-sm">
              <input type="radio" name="q" checked={!dataSaver && activeLevel === -1} onChange={() => { onDataSaverChange(false); onQualityChange(-1); }} className="accent-red" />
              Auto
            </label>
            {levels.map((lvl, i) => (
              <label key={i} className="flex items-center justify-between gap-2 py-1 text-sm">
                <span className="flex items-center gap-2">
                  <input type="radio" name="q" checked={!dataSaver && activeLevel === i} onChange={() => { onDataSaverChange(false); onQualityChange(i); }} className="accent-red" />
                  {lvl.height}p
                </span>
                {lvl.bitrate > 0 && <span className="text-[11px] text-white/40">{(lvl.bitrate * 3600 / 8 / 1e9).toFixed(1)} GB/hr</span>}
              </label>
            ))}
            <label className="flex items-center gap-2 py-1.5 text-sm mt-1 border-t border-line pt-2">
              <input
                type="checkbox"
                checked={dataSaver}
                onChange={(e) => onDataSaverChange(e.target.checked)}
                className="accent-red"
              />
              Data Saver (caps to lowest renditions)
            </label>
          </section>
        )}
      </div>
    </div>
  );
}
