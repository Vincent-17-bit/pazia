import { useCallback, useEffect, useRef, useState } from 'react';
import PlayerCore from './PlayerCore.jsx';
import ControlsOverlay from './controls/ControlsOverlay.jsx';
import SettingsPanel from './controls/SettingsPanel.jsx';
import SubtitleOverlay from './SubtitleOverlay.jsx';
import ErrorOverlay from './ErrorOverlay.jsx';
import BufferingSpinner from './BufferingSpinner.jsx';
import { useSubtitleSettings, subtitleCssVars } from './hooks/useSubtitleSettings.js';
import { loadPlayerPrefs, savePlayerPrefs } from './hooks/usePlayerPrefs.js';
import { parseVtt, getActiveCue } from './utils/vtt.js';

export default function Player({
  source, startAt = 0, onProgress, onEnded, onBack, title, subtitle,
  showNext, nextCountdown, onPlayNext, onCancelNext, onNearEnd,
  mediaType, tmdbId,
}) {
  const coreRef = useRef(null);
  const containerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const lastTapRef = useRef({ t: 0, side: null });
  const flashTimerRef = useRef(null);
  const weakConnTimerRef = useRef(null);

  const initialPrefs = loadPlayerPrefs();
  const [state, setState] = useState({
    playing: false, current: 0, duration: 0, buffered: 0,
    volume: initialPrefs.volume, muted: initialPrefs.muted, rate: 1,
    levels: [], activeLevel: -1, audioTracks: [], activeAudioTrack: -1,
    pipAvailable: false, buffering: false, fatalError: null, airplayAvailable: false,
  });
  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [screenFit, setScreenFit] = useState('contain');
  const [fullscreen, setFullscreen] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const [flash, setFlash] = useState(null);
  const [dataSaver, setDataSaver] = useState(false);
  const [weakConnection, setWeakConnection] = useState(false);
  const [activeSubtitleLang, setActiveSubtitleLang] = useState('off');
  const [subtitleCues, setSubtitleCues] = useState([]);

  const { settings: subSettings, update: updateSubSettings, reset: resetSubSettings } = useSubtitleSettings();

  const onState = useCallback((patch) => setState((s) => ({ ...s, ...patch })), []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    if (!settingsOpen) hideTimerRef.current = setTimeout(() => {
      setControlsVisible((v) => (stateRef.current.playing ? false : v));
    }, 3000);
  }, [settingsOpen]);

  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    if (settingsOpen) { clearTimeout(hideTimerRef.current); setControlsVisible(true); }
    else showControls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen]);

  useEffect(() => {
    if (activeSubtitleLang === 'off') { setSubtitleCues([]); return; }
    const track = source.subtitles?.find((t) => t.lang === activeSubtitleLang);
    if (!track) return;
    let cancelled = false;
    fetch(track.url).then((r) => r.text()).then((text) => {
      if (!cancelled) setSubtitleCues(parseVtt(text));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [activeSubtitleLang, source.subtitles]);

  const activeCue = getActiveCue(subtitleCues, state.current);

  const nearEndFiredRef = useRef(false);
  useEffect(() => {
    if (!onNearEnd || !state.duration || nearEndFiredRef.current) return;
    if (state.current / state.duration >= 0.95) {
      nearEndFiredRef.current = true;
      onNearEnd();
    }
  }, [state.current, state.duration, onNearEnd]);

  // weak-connection toast: only meaningful on Auto (adaptive) quality
  useEffect(() => {
    if (state.buffering && state.activeLevel === -1) {
      weakConnTimerRef.current = setTimeout(() => setWeakConnection(true), 5000);
    } else {
      clearTimeout(weakConnTimerRef.current);
      setWeakConnection(false);
    }
    return () => clearTimeout(weakConnTimerRef.current);
  }, [state.buffering, state.activeLevel]);

  function handleSaveNow(pos, dur, final, keepalive) {
    onProgress?.(pos, dur, keepalive);
  }

  function togglePlay() { state.playing ? coreRef.current?.pause() : coreRef.current?.play(); }
  function seekTo(t) { coreRef.current?.seekTo(t); }
  function seekBy(delta) { coreRef.current?.seekTo(Math.max(0, Math.min(state.duration, state.current + delta))); }
  function setVolume(v) {
    setState((s) => ({ ...s, volume: v, muted: false }));
    coreRef.current?.setVolume(v);
    coreRef.current?.setMuted(false);
    savePlayerPrefs({ volume: v, muted: false });
  }
  function toggleMute() {
    const m = !state.muted;
    setState((s) => ({ ...s, muted: m }));
    coreRef.current?.setMuted(m);
    savePlayerPrefs({ volume: state.volume, muted: m });
  }
  function setRate(r) { setState((s) => ({ ...s, rate: r })); coreRef.current?.setRate(r); }
  function setQuality(i) { coreRef.current?.setQuality(i); }
  function setAudioTrack(i) { coreRef.current?.setAudioTrack(i); }
  function toggleDataSaver(on) { setDataSaver(on); coreRef.current?.setDataSaverCap(on); }
  function retry() { setState((s) => ({ ...s, fatalError: null })); coreRef.current?.retry(); }

  function toggleFullscreen() {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }
  useEffect(() => {
    function onChange() { setFullscreen(!!document.fullscreenElement); }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  function togglePip() {
    if (document.pictureInPictureElement) document.exitPictureInPicture?.();
    else coreRef.current?.getVideoEl?.()?.requestPictureInPicture?.().catch(() => {});
  }
  function toggleAirplay() { coreRef.current?.showAirplayPicker?.(); }
  useEffect(() => {
    const video = coreRef.current?.getVideoEl?.();
    if (!video) return;
    function onEnter() { setPipActive(true); }
    function onLeave() { setPipActive(false); }
    video.addEventListener('enterpictureinpicture', onEnter);
    video.addEventListener('leavepictureinpicture', onLeave);
    return () => {
      video.removeEventListener('enterpictureinpicture', onEnter);
      video.removeEventListener('leavepictureinpicture', onLeave);
    };
  }, [state.duration]);

  function triggerFlash(side) {
    setFlash({ side, key: Date.now() });
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(null), 500);
  }

  const lastKeySeekRef = useRef(0);
  useEffect(() => {
    function onKey(e) {
      if (settingsOpen || e.target.tagName === 'INPUT') return;
      const now = Date.now();
      if (e.key === ' ' || e.key.toLowerCase() === 'k') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowRight') { seekBy(10); lastKeySeekRef.current = now; }
      else if (e.key === 'ArrowLeft') { seekBy(-10); lastKeySeekRef.current = now; }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setVolume(Math.min(1, state.volume + 0.1)); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setVolume(Math.max(0, state.volume - 0.1)); }
      else if (e.key.toLowerCase() === 'm') toggleMute();
      else if (e.key.toLowerCase() === 'f') toggleFullscreen();
      showControls();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen, state.playing, state.current, state.duration, state.volume, state.muted, showControls]);

  function onTouchEndContainer(e) {
    if (settingsOpen) return;
    if (e.target.closest('button, input, select, a, [role="button"]')) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.changedTouches[0].clientX - rect.left;
    const side = x < rect.width * 0.4 ? 'left' : x > rect.width * 0.6 ? 'right' : null;
    const now = Date.now();
    if (side && lastTapRef.current.side === side && now - lastTapRef.current.t < 300) {
      if (now - lastKeySeekRef.current > 400) { seekBy(side === 'left' ? -10 : 10); triggerFlash(side); }
      lastTapRef.current = { t: 0, side: null };
    } else {
      lastTapRef.current = { t: now, side };
      if (controlsVisible) { clearTimeout(hideTimerRef.current); setControlsVisible(false); }
      else showControls();
    }
  }

  const showSkipIntro = source.introEnd && state.current < source.introEnd && state.current < 90;

  // embed-only sources (vimeo, archive.org fallback) - no custom controls, provider handles its own UI
  if (source.type === 'iframe') {
    return (
      <div className="fixed inset-0 bg-black z-[200]">
        <button
          onClick={onBack}
          className="absolute top-[calc(16px+env(safe-area-inset-top,0px))] left-4 z-10 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-white fill-none stroke-2"><path d="M15 19l-7-7 7-7" /></svg>
        </button>
        <iframe
          src={source.url}
          title={title || 'Player'}
          className="w-full h-full border-0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[200] overflow-hidden"
      onMouseMove={showControls}
      onTouchEnd={onTouchEndContainer}
      style={{ ...subtitleCssVars(subSettings), '--video-fit': screenFit }}
    >
      <div className="player-video-fit w-full h-full" onClick={togglePlay}>
        <PlayerCore
          ref={coreRef}
          source={source}
          startAt={startAt}
          onState={onState}
          onEnded={onEnded}
          onSaveNow={handleSaveNow}
        />
      </div>

      {state.buffering && !state.fatalError && <BufferingSpinner weakConnection={weakConnection} />}

      <SubtitleOverlay text={activeCue?.text} controlsVisible={controlsVisible} />

      {showSkipIntro && !settingsOpen && (
        <button
          onClick={() => seekTo(source.introEnd)}
          className="absolute bottom-28 right-5 z-20 bg-surface/90 border border-line rounded-md px-4 py-2 text-sm font-semibold"
        >
          Skip Intro
        </button>
      )}

      <ControlsOverlay
        visible={controlsVisible}
        title={title}
        subtitle={subtitle}
        mediaType={mediaType}
        tmdbId={tmdbId}
        playing={state.playing}
        current={state.current}
        duration={state.duration}
        buffered={state.buffered}
        volume={state.volume}
        muted={state.muted}
        onBack={onBack}
        onTogglePlay={togglePlay}
        onSeek={seekTo}
        onSeekBy={(d) => { seekBy(d); triggerFlash(d < 0 ? 'left' : 'right'); }}
        onVolumeChange={setVolume}
        onToggleMute={toggleMute}
        onOpenSettings={() => setSettingsOpen(true)}
        subtitleTracks={source.subtitles}
        activeSubtitleLang={activeSubtitleLang}
        onSubtitleChange={setActiveSubtitleLang}
        screenFit={screenFit}
        onToggleScreenFit={() => setScreenFit((f) => (f === 'contain' ? 'cover' : 'contain'))}
        fullscreen={fullscreen}
        onToggleFullscreen={toggleFullscreen}
        pipAvailable={state.pipAvailable}
        pipActive={pipActive}
        onTogglePip={togglePip}
        airplayAvailable={state.airplayAvailable}
        onAirplay={toggleAirplay}
        qualityLabel={dataSaver ? 'Saver' : state.activeLevel === -1 ? 'Auto' : `${state.levels[state.activeLevel]?.height || ''}p`}
        showNext={showNext && !settingsOpen}
        nextCountdown={nextCountdown}
        onPlayNext={onPlayNext}
        onCancelNext={onCancelNext}
        flash={flash}
      />

      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          audioTracks={state.audioTracks}
          activeAudioTrack={state.activeAudioTrack}
          onAudioChange={setAudioTrack}
          subtitleTracks={source.subtitles}
          activeSubtitleLang={activeSubtitleLang}
          onSubtitleChange={setActiveSubtitleLang}
          subtitleSettings={subSettings}
          updateSubtitleSettings={updateSubSettings}
          resetSubtitleSettings={resetSubSettings}
          rate={state.rate}
          onRateChange={setRate}
          levels={state.levels}
          activeLevel={state.activeLevel}
          onQualityChange={setQuality}
          dataSaver={dataSaver}
          onDataSaverChange={toggleDataSaver}
        />
      )}

      {state.fatalError && <ErrorOverlay message={state.fatalError} onRetry={retry} onBack={onBack} />}
    </div>
  );
}
