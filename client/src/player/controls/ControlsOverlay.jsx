import { useState, useEffect } from 'react';
import { formatTime, formatRemaining } from '../utils/format.js';
import MyListButton from '../../components/MyListButton.jsx';

function Icon({ d, className = 'w-5 h-5 stroke-white' }) {
  return <svg viewBox="0 0 24 24" className={`${className} fill-none stroke-2`}><path d={d} /></svg>;
}

export default function ControlsOverlay({
  visible,
  title, subtitle,
  playing, current, duration, buffered, volume, muted,
  onBack, onTogglePlay, onSeek, onSeekBy, onVolumeChange, onToggleMute, onOpenSettings,
  subtitleTracks, activeSubtitleLang, onSubtitleChange,
  screenFit, onToggleScreenFit,
  fullscreen, onToggleFullscreen,
  pipAvailable, pipActive, onTogglePip,
  airplayAvailable, onAirplay,
  qualityLabel,
  showNext, nextCountdown, onPlayNext, onCancelNext,
  flash,
  mediaType, tmdbId,
}) {
  const pct = duration ? (current / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const subtitleOn = activeSubtitleLang && activeSubtitleLang !== 'off';
  useEffect(() => { if (!visible) setSubMenuOpen(false); }, [visible]);

  return (
    <>
      {flash && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${flash.side === 'left' ? 'left-8' : 'right-8'} text-white text-sm font-semibold bg-black/50 rounded-full px-3 py-1.5 pointer-events-none animate-flash-seek`}
        >
          {flash.side === 'left' ? '⟲ 10' : '10 ⟳'}
        </div>
      )}

      <div className={`absolute inset-0 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div
          className="absolute top-0 left-0 right-0 flex items-center gap-3 px-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-6"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.75), transparent)' }}
        >
          <button onClick={onBack} aria-label="Back" className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <Icon d="M15 19l-7-7 7-7" />
          </button>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{title}</div>
            {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
          </div>
          <div className="flex-1" />
          {mediaType && tmdbId && (
            <MyListButton mediaType={mediaType} tmdbId={tmdbId} variant="icon" size="md" bordered={false} />
          )}
          <button onClick={(e) => { e.stopPropagation(); onOpenSettings(); }} aria-label="Settings" className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <Icon d="M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.3 1a7 7 0 00-2-1.2L14 3h-4l-.6 2.6a7 7 0 00-2 1.2l-2.3-1-2 3.4 2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.3-1a7 7 0 002 1.2L10 21h4l.6-2.6a7 7 0 002-1.2l2.3 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z" />
          </button>
        </div>

        <div className="absolute inset-0 flex items-center justify-center gap-10">
          <button onClick={() => onSeekBy(-10)} aria-label="Back 10 seconds" className="min-w-[44px] min-h-[44px] flex flex-col items-center text-white/90">
            <Icon d="M12 5V1L7 6l5 5V7a5 5 0 11-5 5H5a7 7 0 107-7z" className="w-7 h-7 stroke-white" />
            <span className="text-[10px] -mt-1">10</span>
          </button>
          <button onClick={onTogglePlay} aria-label={playing ? 'Pause' : 'Play'} className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            {playing ? <Icon d="M8 5v14M16 5v14" className="w-7 h-7 stroke-white" /> : <Icon d="M7 4l13 8-13 8V4z" className="w-7 h-7 stroke-white" />}
          </button>
          <button onClick={() => onSeekBy(10)} aria-label="Forward 10 seconds" className="min-w-[44px] min-h-[44px] flex flex-col items-center text-white/90">
            <Icon d="M12 5V1l5 5-5 5V7a5 5 0 105 5h2a7 7 0 10-7-7z" className="w-7 h-7 stroke-white" />
            <span className="text-[10px] -mt-1">10</span>
          </button>
        </div>

        <div
          className="absolute bottom-0 left-0 right-0 px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-10"
          style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.85), transparent)' }}
        >
          <div className="relative h-4 flex items-center mb-1 group">
            <div className="relative w-full h-1 rounded-full bg-white/25">
              <div className="absolute h-1 rounded-full bg-white/40" style={{ width: `${bufPct}%` }} />
              <div className="absolute h-1 rounded-full bg-red" style={{ width: `${pct}%` }} />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={current}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              aria-label="Seek"
            />
          </div>

          <div className="flex items-center gap-3 text-white">
            <button onClick={onTogglePlay} aria-label={playing ? 'Pause' : 'Play'} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
              {playing ? <Icon d="M8 5v14M16 5v14" /> : <Icon d="M7 4l13 8-13 8V4z" />}
            </button>

            <div className="hidden md:flex items-center group/vol">
              <button onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Icon d={muted || volume === 0 ? 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6' : 'M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7'} />
              </button>
              <input
                type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-red overflow-hidden"
                aria-label="Volume"
              />
            </div>
            <button onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'} className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center">
              <Icon d={muted || volume === 0 ? 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6' : 'M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7'} />
            </button>

            <span className="text-xs text-white/80 tabular-nums">{formatTime(current)}</span>
            <div className="flex-1" />
            <span className="text-xs text-white/60 tabular-nums">{formatRemaining(current, duration)}</span>
            {qualityLabel && (
              <span className="hidden sm:inline text-[10px] text-white/50 border border-white/20 rounded px-1.5 py-0.5">{qualityLabel}</span>
            )}

            {subtitleTracks?.length > 0 ? (
              <div className="relative">
                {subMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 bg-surface border border-line rounded-lg p-2 flex flex-col gap-1 min-w-[120px]">
                    <button
                      onClick={() => { onSubtitleChange('off'); setSubMenuOpen(false); }}
                      className={`text-xs px-2.5 py-1.5 rounded-full border text-left ${!subtitleOn ? 'border-red text-red' : 'border-line text-white/70'}`}
                    >
                      Off
                    </button>
                    {subtitleTracks.map((t) => (
                      <button
                        key={t.lang}
                        onClick={() => { onSubtitleChange(t.lang); setSubMenuOpen(false); }}
                        className={`text-xs px-2.5 py-1.5 rounded-full border text-left ${activeSubtitleLang === t.lang ? 'border-red text-red' : 'border-line text-white/70'}`}
                      >
                        {t.lang}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setSubMenuOpen((v) => !v)}
                  aria-label="Subtitles"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Icon d="M4 5h16v11H8l-4 4V5z" className={`w-5 h-5 ${subtitleOn ? 'stroke-red' : 'stroke-white'}`} />
                </button>
              </div>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); onOpenSettings(); }} aria-label="Subtitles" className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Icon d="M4 5h16v11H8l-4 4V5z" />
              </button>
            )}
            <button onClick={onToggleScreenFit} aria-label="Screen fit" className="min-w-[44px] min-h-[44px] hidden sm:flex items-center justify-center">
              <Icon d={screenFit === 'contain' ? 'M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4' : 'M4 4h16v16H4z'} />
            </button>
            {airplayAvailable && (
              <button onClick={onAirplay} aria-label="AirPlay" className="min-w-[44px] min-h-[44px] hidden sm:flex items-center justify-center">
                <Icon d="M4 5h16v10H4zM8 21l4-5 4 5z" />
              </button>
            )}
            {pipAvailable && (
              <button onClick={onTogglePip} aria-label="Picture in picture" className="min-w-[44px] min-h-[44px] hidden sm:flex items-center justify-center">
                <Icon d="M4 5h16v14H4zM12 12h7v6h-7z" className={`w-5 h-5 ${pipActive ? 'stroke-red' : 'stroke-white'}`} />
              </button>
            )}
            <button onClick={onToggleFullscreen} aria-label="Fullscreen" className="min-w-[44px] min-h-[44px] flex items-center justify-center">
              <Icon d={fullscreen ? 'M9 4v4H5M15 4v4h4M9 20v-4H5M15 20v-4h4' : 'M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4'} />
            </button>
          </div>
        </div>
      </div>

      {showNext && (
        <div className="absolute bottom-24 right-5 z-20 bg-surface border border-line rounded-xl p-4 w-60 animate-sheet-up">
          <div className="text-sm font-semibold mb-1">Next Episode in {nextCountdown}s</div>
          <div className="flex gap-2 mt-3">
            <button onClick={onPlayNext} className="flex-1 bg-red rounded-md py-2 text-sm font-semibold">Play now</button>
            <button onClick={onCancelNext} aria-label="Dismiss" className="w-9 min-w-[44px] min-h-[44px] border border-line rounded-md py-2 text-sm flex items-center justify-center">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
