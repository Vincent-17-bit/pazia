import { useCallback, useEffect, useRef, useState } from 'react';
import PlayerCore from './PlayerCore.jsx';
import ControlsOverlay from './controls/ControlsOverlay.jsx';
import SettingsPanel from './controls/SettingsPanel.jsx';
import SubtitleOverlay from './SubtitleOverlay.jsx';
import { useSubtitleSettings, subtitleCssVars } from './hooks/useSubtitleSettings.js';
import { parseVtt, getActiveCue } from './utils/vtt.js';

export default function Player({
  source, startAt = 0, onProgress, onEnded, onBack, title, subtitle,
  showNext, nextCountdown, onPlayNext, onCancelNext, onNearEnd,
}) {
  const coreRef = useRef(null);
  const containerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const lastTapRef = useRef({ t: 0, side: null });
  const flashTimerRef = useRef(null);

  const [state, setState] = useState({
    playing: false, current: 0, duration: 0, buffered: 0,
    volume: 1, muted: false, rate: 1,
    levels: [], activeLevel: -1, audioTracks: [], activeAudioTrack: -1,
    pipAvailable: false,
  });
  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [screenFit, setScreenFit] = useState('contain');
  const [fullscreen, setFullscreen] = useState(false);
  const [pipActive, setPipActive] = useState(false);
  const [flash, setFlash] = useState(null);
  const [dataSaver, setDataSaver] = useState(false);
  const [activeSubtitleLang, setActiveSubtitleLang] = useState('off');
  const [subtitleCues, setSubtitleCues] = useState([]);

  const { settings: subSettings, update: updateSubSettings, reset: resetSubSettings } = useSubtitleSettings();

  const onState = useCallback((patch) => setState((s) => ({ ...s, ...patch })), []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    if (!settingsOpen) hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, [settingsOpen]);

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

  function handleSaveNow(pos, dur, final, keepalive) {
    onProgress?.(pos, dur, keepalive);
  }

  function togglePlay() { state.playing ? coreRef.current?.pause() : coreRef.current?.play(); }
  function seekTo(t) { coreRef.current?.seekTo(t); }
  function seekBy(delta) { coreRef.current?.seekTo(Math.max(0, Math.min(state.duration, state.current + delta))); }
  function setVolume(v) { setState((s) => ({ ...s, volume: v, muted: false })); coreRef.current?.setVolume(v); coreRef.current?.setMuted(false); }
  function toggleMute() { const m = !state.muted; setState((s) => ({ ...s, muted: m })); coreRef.current?.setMuted(m); }
  function setRate(r) { setState((s) => ({ ...s, rate: r })); coreRef.current?.setRate(r); }
  function setQuality(i) { coreRef.current?.setQuality(i); }
  function setAudioTrack(i) { coreRef.current?.setAudioTrack(i); }

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

      <SubtitleOverlay text={activeCue?.text} controlsVisible={controlsVisible} />

      <ControlsOverlay
        visible={controlsVisible}
        title={title}
        subtitle={subtitle}
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
        screenFit={screenFit}
        onToggleScreenFit={() => setScreenFit((f) => (f === 'contain' ? 'cover' : 'contain'))}
        fullscreen={fullscreen}
        onToggleFullscreen={toggleFullscreen}
        pipAvailable={state.pipAvailable}
        pipActive={pipActive}
        onTogglePip={togglePip}
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
          onDataSaverChange={setDataSaver}
        />
      )}
    </div>
  );
}
