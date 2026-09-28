import { useState, useEffect } from 'react';
import { formatTime, formatRemaining } from '../utils/format.js';
import MyListButton from '../../components/MyListButton.jsx';
import Tooltip from '../../components/Tooltip.jsx';

function Icon({ d, className = 'w-5 h-5 stroke-white' }) {
  return <svg viewBox="0 0 24 24" className={`${className} fill-none stroke-2`}><path d={d} /></svg>;
}

const BTN = 'min-w-[44px] min-h-[44px] items-center justify-center';
const MUTED_D = 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6';
const VOLUME_D = 'M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7';
const SUBTITLE_D = 'M4 5h16v11H8l-4 4V5z';
const GEAR_D = 'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.6-2-3.4-2.3 1a7 7 0 00-2-1.2L14 3h-4l-.6 2.6a7 7 0 00-2 1.2l-2.3-1-2 3.4 2 1.6A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.3-1a7 7 0 002 1.2L10 21h4l.6-2.6a7 7 0 002-1.2l2.3 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z';
const AUDIO_D = 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z';
const LANDSCAPE_D = 'M3 7h18v10H3z';
const PORTRAIT_D = 'M7 3h10v18H7z';
const NEXT_D = 'M6 5l10 7-10 7V5zM19 5v14';

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
  landscape = false, short = false, forced = false,
  orientationAvailable = false, orientationActive = false, onToggleOrientation,
  audioTracks, onOpenAudio,
}) {
  const pct = duration ? (current / duration) * 100 : 0;
  const bufPct = duration ? (buffered / duration) * 100 : 0;
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const subtitleOn = activeSubtitleLang && activeSubtitleLang !== 'off';
  useEffect(() => { if (!visible) { setSubMenuOpen(false); setMoreOpen(false); } }, [visible]);
  useEffect(() => { if (!short) setMoreOpen(false); }, [short]);

  const ic = landscape ? 'pl-ic' : 'w-5 h-5';
  const I = (d, tone = 'stroke-white') => <Icon d={d} className={`${ic} ${tone}`} />;
  const hiddenSm = landscape ? 'flex' : 'hidden sm:flex';
  const muteLabel = muted ? 'Unmute' : 'Mute';
  const muteD = muted || volume === 0 ? MUTED_D : VOLUME_D;

  const gradientTop = { background: 'linear-gradient(180deg, rgba(0,0,0,0.75), transparent)' };
  const gradientBottom = { background: 'linear-gradient(0deg, rgba(0,0,0,0.85), transparent)' };

  const renderSubtitle = (down) => (
    subtitleTracks?.length > 0 ? (
      <div className="relative">
        {subMenuOpen && (
          <div className={`absolute ${down ? 'top-full mt-2' : 'bottom-full mb-2'} right-0 z-30 bg-surface border border-line rounded-lg p-2 flex flex-col gap-1 min-w-[120px]`}>
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
        <Tooltip label="Subtitles">
          <button
            onClick={(e) => { e.stopPropagation(); setSubMenuOpen((v) => !v); }}
            aria-label="Subtitles"
            className={`${BTN} flex`}
          >
            {I(SUBTITLE_D, subtitleOn ? 'stroke-red' : 'stroke-white')}
          </button>
        </Tooltip>
      </div>
    ) : (
      <Tooltip label="Subtitles">
        <button onClick={(e) => { e.stopPropagation(); onOpenSettings(); }} aria-label="Subtitles" className={`${BTN} flex`}>
          {I(SUBTITLE_D)}
        </button>
      </Tooltip>
    )
  );

  const settingsBtn = (
    <Tooltip label="Settings">
      <button
        onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
        aria-label="Settings"
        className={`${BTN} flex`}
      >
        {I(GEAR_D)}
      </button>
    </Tooltip>
  );

  const fitBtn = (
    <Tooltip label="Screen fit">
      <button onClick={onToggleScreenFit} aria-label="Screen fit" className={`${BTN} ${hiddenSm}`}>
        {I(screenFit === 'contain' ? 'M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4' : 'M4 4h16v16H4z')}
      </button>
    </Tooltip>
  );

  const airplayBtn = airplayAvailable && (
    <Tooltip label="AirPlay">
      <button onClick={onAirplay} aria-label="AirPlay" className={`${BTN} ${hiddenSm}`}>
        {I('M4 5h16v10H4zM8 21l4-5 4 5z')}
      </button>
    </Tooltip>
  );

  const pipBtn = pipAvailable && (
    <Tooltip label="Mini Player">
      <button onClick={onTogglePip} aria-label="Picture in picture" className={`${BTN} ${hiddenSm}`}>
        {I('M4 5h16v14H4zM12 12h7v6h-7z', pipActive ? 'stroke-red' : 'stroke-white')}
      </button>
    </Tooltip>
  );

  const fullscreenBtn = !forced && (
    <Tooltip label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
      <button onClick={onToggleFullscreen} aria-label="Fullscreen" className={`${BTN} flex`}>
        {I(fullscreen ? 'M9 4v4H5M15 4v4h4M9 20v-4H5M15 20v-4h4' : 'M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4')}
      </button>
    </Tooltip>
  );

  const myListBtn = mediaType && tmdbId && (
    <Tooltip label="My List">
      <MyListButton mediaType={mediaType} tmdbId={tmdbId} variant="icon" size="md" bordered={false} />
    </Tooltip>
  );

  const orientationLabel = orientationActive ? 'Portrait' : 'Landscape';
  const orientationBtn = orientationAvailable && (
    <Tooltip label={orientationLabel}>
      <button
        onClick={(e) => { e.stopPropagation(); onToggleOrientation(); }}
        aria-label={orientationLabel}
        className={`${BTN} flex`}
      >
        {I(orientationActive ? PORTRAIT_D : LANDSCAPE_D)}
      </button>
    </Tooltip>
  );

  const audioBtn = audioTracks?.length > 1 && (
    <Tooltip label="Audio language">
      <button onClick={(e) => { e.stopPropagation(); onOpenAudio(); }} aria-label="Audio language" className={`${BTN} flex`}>
        {I(AUDIO_D)}
      </button>
    </Tooltip>
  );

  const moreBtn = (
    <div className="relative">
      {moreOpen && (
        <div className="absolute bottom-full right-0 mb-2 z-30 bg-surface border border-line rounded-lg p-1 flex">
          {fitBtn}
          {airplayBtn}
          {myListBtn}
        </div>
      )}
      <Tooltip label="More">
        <button
          onClick={(e) => { e.stopPropagation(); setMoreOpen((v) => !v); }}
          aria-label="More"
          aria-expanded={moreOpen}
          className={`${BTN} flex`}
        >
          <svg viewBox="0 0 24 24" className="pl-ic fill-white">
            <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
          </svg>
        </button>
      </Tooltip>
    </div>
  );

  const nextBtn = mediaType === 'tv' && onPlayNext && (
    <Tooltip label="Next episode">
      <button
        onClick={(e) => { e.stopPropagation(); onPlayNext(); }}
        aria-label="Next episode"
        className="min-h-[44px] px-3 flex items-center gap-1.5 rounded-md border border-white/30 text-xs font-semibold whitespace-nowrap"
      >
        <Icon d={NEXT_D} className="w-4 h-4 stroke-white" />
        Next Episode
      </button>
    </Tooltip>
  );

  const seekTrack = (
    <>
      <div className="relative w-full h-1 rounded-full bg-white/25">
        <div className="absolute h-1 rounded-full bg-white/40" style={{ width: `${bufPct}%` }} />
        <div className="absolute h-1 rounded-full bg-red" style={{ width: `${pct}%` }} />
      </div>
    </>
  );

  const seekInput = (extra) => (
    <input
      type="range"
      min={0}
      max={duration || 0}
      step={0.1}
      value={current}
      onChange={(e) => onSeek(Number(e.target.value))}
      className={`absolute inset-0 w-full opacity-0 cursor-pointer ${extra}`}
      aria-label="Seek"
    />
  );

  const muteBtn = (cls) => (
    <Tooltip label={muteLabel}>
      <button onClick={onToggleMute} aria-label={muteLabel} className={cls}>
        <Icon d={muteD} className={`${ic} stroke-white`} />
      </button>
    </Tooltip>
  );

  const backBtn = (
    <Tooltip label="Back">
      <button
        onClick={(e) => { e.stopPropagation(); onBack(); }}
        aria-label="Back"
        className="w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
      >
        <Icon d="M15 19l-7-7 7-7" />
      </button>
    </Tooltip>
  );

  const seekIcon = landscape ? 'pl-ic-lg stroke-white' : 'w-7 h-7 stroke-white';
  const playIcon = playing
    ? <Icon d="M8 5v14M16 5v14" className={seekIcon} />
    : <Icon d="M7 4l13 8-13 8V4z" className={seekIcon} />;

  const center = (
    <div className={`absolute inset-0 flex items-center justify-center ${landscape ? 'gap-6' : 'gap-10'} pointer-events-none`}>
      <Tooltip label="Back 10 seconds">
        <button onClick={() => onSeekBy(-10)} aria-label="Back 10 seconds" className="pointer-events-auto min-w-[44px] min-h-[44px] flex flex-col items-center justify-center text-white/90">
          <Icon d="M12 5V1L7 6l5 5V7a5 5 0 11-5 5H5a7 7 0 107-7z" className={seekIcon} />
          <span className="text-[10px] -mt-1">10</span>
        </button>
      </Tooltip>
      <Tooltip label={playing ? 'Pause' : 'Play'}>
        <button onClick={onTogglePlay} aria-label={playing ? 'Pause' : 'Play'} className={`pointer-events-auto ${landscape ? 'pl-play' : 'w-16 h-16'} rounded-full bg-white/10 flex items-center justify-center`}>
          {playIcon}
        </button>
      </Tooltip>
      <Tooltip label="Forward 10 seconds">
        <button onClick={() => onSeekBy(10)} aria-label="Forward 10 seconds" className="pointer-events-auto min-w-[44px] min-h-[44px] flex flex-col items-center justify-center text-white/90">
          <Icon d="M12 5V1l5 5-5 5V7a5 5 0 105 5h2a7 7 0 10-7-7z" className={seekIcon} />
          <span className="text-[10px] -mt-1">10</span>
        </button>
      </Tooltip>
    </div>
  );

  const portraitBars = (
    <>
      <div
        className="absolute top-0 left-0 right-0 flex items-center gap-3 px-4 pt-[calc(14px+env(safe-area-inset-top,0px))] pb-6"
        style={gradientTop}
      >
        {backBtn}
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{title}</div>
          {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
        </div>
      </div>

      {center}

      <div
        className="absolute bottom-0 left-0 right-0 px-4 pb-[calc(14px+env(safe-area-inset-bottom,0px))] pt-10"
        style={gradientBottom}
      >
        <div className="relative h-4 flex items-center mb-1 group">
          {seekTrack}
          {seekInput('')}
        </div>

        <div className="flex items-center gap-3 text-white overflow-x-auto">
          <Tooltip label={playing ? 'Pause' : 'Play'}>
            <button onClick={onTogglePlay} aria-label={playing ? 'Pause' : 'Play'} className="min-w-[44px] min-h-[44px] flex items-center justify-center">
              {playing ? <Icon d="M8 5v14M16 5v14" /> : <Icon d="M7 4l13 8-13 8V4z" />}
            </button>
          </Tooltip>

          <div className="hidden md:flex items-center group/vol">
            {muteBtn('min-w-[44px] min-h-[44px] flex items-center justify-center')}
            <input
              type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-0 group-hover/vol:w-20 transition-all duration-200 accent-red overflow-hidden"
              aria-label="Volume"
            />
          </div>
          {muteBtn('md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center')}

          <span className="text-xs text-white/80 tabular-nums">{formatTime(current)}</span>
          <div className="flex-1" />
          <span className="text-xs text-white/60 tabular-nums">{formatRemaining(current, duration)}</span>
          {qualityLabel && (
            <span className="hidden sm:inline text-[10px] text-white/50 border border-white/20 rounded px-1.5 py-0.5">{qualityLabel}</span>
          )}

          {renderSubtitle(false)}
          {fitBtn}
          {airplayBtn}
          {pipBtn}
          {orientationBtn}
          {fullscreenBtn}
          {myListBtn}
          {settingsBtn}
        </div>
      </div>
    </>
  );

  const landscapeBars = (
    <>
      <div
        className="absolute top-0 left-0 right-0 flex items-center gap-2 pt-[calc(8px+var(--sat))] pb-6 pl-[calc(12px+var(--sal))] pr-[calc(12px+var(--sar))]"
        style={gradientTop}
      >
        {backBtn}
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{title}</div>
          {subtitle && <div className="text-xs text-white/60 truncate">{subtitle}</div>}
        </div>
        {renderSubtitle(true)}
        {audioBtn}
        {settingsBtn}
      </div>

      {center}

      <div
        className="absolute bottom-0 left-0 right-0 pt-6 pl-[calc(16px+var(--sal))] pr-[calc(16px+var(--sar))] pb-[calc(8px+var(--sab))]"
        style={gradientBottom}
      >
        <div className="relative h-9 flex items-center">
          {seekTrack}
          <div
            className="absolute top-1/2 w-4 h-4 -mt-2 -ml-2 rounded-full bg-red pointer-events-none"
            style={{ left: `${pct}%` }}
          />
          {seekInput('h-full pl-seek')}
        </div>

        <div className="flex justify-between text-xs tabular-nums -mt-1 mb-1">
          <span className="text-white/80">{formatTime(current)}</span>
          <span className="text-white/60">{formatRemaining(current, duration)}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-white">
          <div className="flex items-center min-w-0">
            {muteBtn(`${BTN} flex`)}
            <input
              type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="pl-vol accent-red"
              aria-label="Volume"
            />
          </div>
          <div className="flex justify-center">{nextBtn}</div>
          <div className="flex items-center justify-end min-w-0">
            {orientationBtn}
            {short ? moreBtn : <>{fitBtn}{airplayBtn}{myListBtn}</>}
            {pipBtn}
            {fullscreenBtn}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {flash && (
        <div
          className={`absolute top-1/2 -translate-y-1/2 ${flash.side === 'left' ? 'left-8' : 'right-8'} text-white text-sm font-semibold bg-black/50 rounded-full px-3 py-1.5 pointer-events-none animate-flash-seek`}
        >
          {flash.side === 'left' ? '⟲ 10' : '10 ⟳'}
        </div>
      )}

      <div className={`absolute inset-0 z-10 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {landscape ? landscapeBars : portraitBars}
      </div>

      {showNext && (
        <div
          className={landscape
            ? 'absolute top-[calc(60px+var(--sat))] right-[calc(12px+var(--sar))] z-20 bg-surface border border-line rounded-xl p-3 w-44 animate-sheet-up'
            : 'absolute bottom-24 right-5 z-20 bg-surface border border-line rounded-xl p-4 w-60 animate-sheet-up'}
        >
          <div className="text-sm font-semibold mb-1">Next Episode in {nextCountdown}s</div>
          <div className={`flex gap-2 ${landscape ? 'mt-2' : 'mt-3'}`}>
            <button onClick={onPlayNext} className="flex-1 bg-red rounded-md py-2 text-sm font-semibold">Play now</button>
            <button onClick={onCancelNext} aria-label="Dismiss" className="w-9 min-w-[44px] min-h-[44px] border border-line rounded-md py-2 text-sm flex items-center justify-center">✕</button>
          </div>
        </div>
      )}
    </>
  );
}
