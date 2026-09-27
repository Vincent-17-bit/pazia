import { useState, useRef } from 'react';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SWATCHES = ['#ffffff', '#ffee58', '#4dd0e1', '#81c784', '#000000'];

function resolutionLabel(height) {
  if (height >= 4320) return '8K';
  if (height >= 2160) return '4K';
  if (height >= 1440) return '1440p';
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p HD';
  if (height >= 480) return '480p';
  return `${height}p`;
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white/50 fill-none stroke-2 shrink-0">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none stroke-2 shrink-0">
      <path d="M15 19l-7-7 7-7" />
    </svg>
  );
}
function Check() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-red fill-none stroke-2 shrink-0">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function MenuRow({ label, value, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between gap-3 py-3.5 text-left">
      <span className="text-sm text-white">{label}</span>
      <span className="flex items-center gap-1.5 text-xs text-white/60 min-w-0">
        <span className="truncate max-w-[140px]">{value}</span>
        <ChevronRight />
      </span>
    </button>
  );
}

function OptionRow({ label, sublabel, selected, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between gap-3 py-3 text-left">
      <span className="min-w-0">
        <span className="text-sm text-white block truncate">{label}</span>
        {sublabel && <span className="text-[11px] text-white/50 block truncate">{sublabel}</span>}
      </span>
      {selected && <Check />}
    </button>
  );
}

function SubHeader({ title, onBack }) {
  return (
    <button onClick={onBack} className="w-full flex items-center gap-2 pb-2 mb-1 border-b border-white/25 text-left">
      <ChevronLeft />
      <span className="text-sm font-semibold text-white">{title}</span>
    </button>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-white">{label}</span>
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
  weakConnection,
}) {
  const [view, setView] = useState('main');
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
  const hasLevels = levels?.length > 0;
  const sortedLevels = hasLevels
    ? levels.map((lvl, i) => ({ ...lvl, i })).sort((a, b) => a.height - b.height)
    : [];

  const qualityValue = dataSaver ? 'Data Saver' : activeLevel === -1 ? 'Auto' : hasLevels ? resolutionLabel(levels[activeLevel]?.height || 0) : 'Source';
  const speedValue = rate === 1 ? 'Normal' : `${rate}×`;
  const subtitleValue = subtitleOn ? (subtitleTracks?.find((t) => t.lang === activeSubtitleLang)?.name || activeSubtitleLang) : 'Off';
  const audioValue = audioTracks?.[activeAudioTrack]?.name || audioTracks?.[activeAudioTrack]?.lang || 'Default';

  function closeToMain() { setView('main'); }

  return (
    <div
      className="absolute inset-0 z-30 flex md:justify-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={sheetRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        className="mt-auto md:mt-0 w-full md:w-[380px] md:h-full max-h-[85vh] md:max-h-none overflow-y-auto bg-black rounded-t-2xl md:rounded-none border-t md:border-t-0 md:border-l border-white/25 px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-3 md:pt-5"
      >
        <div className="md:hidden flex justify-center pb-2">
          <div className="w-10 h-1 rounded-full bg-white/30" />
        </div>

        {view === 'main' && (
          <>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold">Settings</h3>
              <button onClick={onClose} aria-label="Close settings" className="w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none stroke-2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="divide-y divide-white/10">
              <MenuRow label="Quality" value={qualityValue} onClick={() => setView('quality')} />
              <MenuRow label="Playback Speed" value={speedValue} onClick={() => setView('speed')} />
              <MenuRow label="Subtitles/CC" value={subtitleValue} onClick={() => setView('subtitles')} />
              {audioTracks?.length > 1 && (
                <MenuRow label="Audio" value={audioValue} onClick={() => setView('audio')} />
              )}
              <MenuRow label="Subtitle Appearance" value="" onClick={() => setView('appearance')} />
            </div>
          </>
        )}

        {view === 'quality' && (
          <>
            <SubHeader title="Quality" onBack={closeToMain} />
            {weakConnection && (
              <div className="text-[11px] text-red bg-red/10 border border-red/30 rounded-md px-2.5 py-2 mb-2 leading-snug">
                Your connection looks slow. Try a lower quality, or Auto, for smoother playback.
              </div>
            )}
            <OptionRow
              label="Auto"
              sublabel={hasLevels ? 'Adjusts automatically to your connection' : undefined}
              selected={!dataSaver && activeLevel === -1}
              onClick={() => { onDataSaverChange(false); onQualityChange(-1); closeToMain(); }}
            />
            {hasLevels ? (
              sortedLevels.map((lvl) => (
                <OptionRow
                  key={lvl.i}
                  label={resolutionLabel(lvl.height)}
                  sublabel={lvl.bitrate > 0 ? `${(lvl.bitrate * 3600 / 8 / 1e9).toFixed(1)} GB/hr` : undefined}
                  selected={!dataSaver && activeLevel === lvl.i}
                  onClick={() => { onDataSaverChange(false); onQualityChange(lvl.i); closeToMain(); }}
                />
              ))
            ) : (
              <p className="text-[11px] text-white/50 py-2 leading-snug">
                This source is a single fixed-quality file — there's no alternate resolution to switch to.
              </p>
            )}
            {hasLevels && (
              <label className="flex items-center gap-2 py-2.5 text-sm mt-1 border-t border-white/25">
                <input type="checkbox" checked={dataSaver} onChange={(e) => onDataSaverChange(e.target.checked)} className="accent-red" />
                Data Saver (caps to lowest quality)
              </label>
            )}
          </>
        )}

        {view === 'speed' && (
          <>
            <SubHeader title="Playback Speed" onBack={closeToMain} />
            {SPEEDS.map((r) => (
              <OptionRow key={r} label={r === 1 ? 'Normal' : `${r}×`} selected={rate === r} onClick={() => { onRateChange(r); closeToMain(); }} />
            ))}
          </>
        )}

        {view === 'subtitles' && (
          <>
            <SubHeader title="Subtitles/CC" onBack={closeToMain} />
            <OptionRow label="Off" selected={!subtitleOn} onClick={() => { onSubtitleChange('off'); closeToMain(); }} />
            {subtitleTracks?.map((t) => (
              <OptionRow key={t.lang} label={t.name || t.lang} selected={activeSubtitleLang === t.lang} onClick={() => { onSubtitleChange(t.lang); closeToMain(); }} />
            ))}
          </>
        )}

        {view === 'audio' && (
          <>
            <SubHeader title="Audio" onBack={closeToMain} />
            {audioTracks?.map((t, i) => (
              <OptionRow key={i} label={t.name || t.lang} selected={activeAudioTrack === i} onClick={() => { onAudioChange(i); closeToMain(); }} />
            ))}
          </>
        )}

        {view === 'appearance' && (
          <>
            <SubHeader title="Subtitle Appearance" onBack={closeToMain} />

            <div className="rounded-md bg-black border border-white/25 py-3 flex items-center justify-center mb-2">
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
              <select value={s.fontFamily} onChange={(e) => updateSubtitleSettings({ fontFamily: e.target.value })} className="bg-black text-white text-xs rounded px-2 py-1 border border-white/40">
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
              <select value={s.edgeStyle} onChange={(e) => updateSubtitleSettings({ edgeStyle: e.target.value })} className="bg-black text-white text-xs rounded px-2 py-1 border border-white/40">
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
            <p className="text-[11px] text-white/60 mt-1 mb-2 leading-snug">
              "Line background" hugs each line of text. "Caption window" shades the whole area behind all lines.
            </p>
            <button onClick={handleReset} className="text-xs border border-white/40 text-white rounded-md px-3 py-1.5 w-full">Reset to defaults</button>
            {toast && <div className="text-[11px] text-red mt-1.5 text-center">Subtitle style reset</div>}
          </>
        )}
      </div>
    </div>
  );
}
