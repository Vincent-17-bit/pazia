import { useEffect, useRef, useState, useCallback } from 'react';

function formatTime(s) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function Player({ source, startAt = 0, onProgress, onEnded, onBack, title, subtitle }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const hideTimerRef = useRef(null);
  const lastSavedRef = useRef(0);
  const lastTapRef = useRef({ t: 0, side: null });

  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [levels, setLevels] = useState([]);
  const [activeLevel, setActiveLevel] = useState(-1);
  const [isYoutube] = useState(source.type === 'youtube');
  const ytPlayerRef = useRef(null);
  const ytIntervalRef = useRef(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    if (isYoutube) return;
    const video = videoRef.current;
    if (!video) return;

    let cleanup = () => {};
    if (source.type === 'hls' && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source.url;
    } else if (source.type === 'hls') {
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls({ capLevelToPlayerSize: true, startLevel: -1 });
          hls.loadSource(source.url);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => setLevels(data.levels || []));
          hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => setActiveLevel(data.level));
          hlsRef.current = hls;
          cleanup = () => hls.destroy();
        } else {
          video.src = source.url;
        }
      });
    } else {
      video.src = source.url;
    }

    return () => cleanup();
  }, [source, isYoutube]);

  useEffect(() => {
    if (!isYoutube) return;
    function init() {
      ytPlayerRef.current = new window.YT.Player(containerRef.current.querySelector('#yt-target'), {
        videoId: source.videoId,
        playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, start: Math.floor(startAt) },
        events: {
          onReady: (e) => {
            setDuration(e.target.getDuration());
            e.target.playVideo();
          },
          onStateChange: (e) => {
            setPlaying(e.data === window.YT.PlayerState.PLAYING);
            if (e.data === window.YT.PlayerState.ENDED) onEnded?.();
          },
        },
      });
      ytIntervalRef.current = setInterval(() => {
        const p = ytPlayerRef.current;
        if (p && p.getCurrentTime) setCurrent(p.getCurrentTime());
      }, 500);
    }
    if (window.YT && window.YT.Player) init();
    else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); init(); };
    }
    return () => {
      clearInterval(ytIntervalRef.current);
      ytPlayerRef.current?.destroy?.();
    };
  }, [isYoutube, source, startAt, onEnded]);

  useEffect(() => {
    if (isYoutube) return;
    const video = videoRef.current;
    if (!video) return;

    function onLoaded() {
      setDuration(video.duration);
      if (startAt > 0) video.currentTime = startAt;
    }
    function onTime() {
      setCurrent(video.currentTime);
      if (video.buffered.length) setBuffered(video.buffered.end(video.buffered.length - 1));
    }
    function onPlay() { setPlaying(true); }
    function onPause() { setPlaying(false); saveNow(); }
    function onEndedEvt() { saveNow(); onEnded?.(); }

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEndedEvt);
    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEndedEvt);
    };
  }, [isYoutube, startAt, onEnded]);

  function saveNow() {
    const pos = isYoutube ? ytPlayerRef.current?.getCurrentTime?.() : videoRef.current?.currentTime;
    const dur = isYoutube ? ytPlayerRef.current?.getDuration?.() : videoRef.current?.duration;
    if (pos != null && dur) onProgress?.(pos, dur, true);
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.abs(current - lastSavedRef.current) >= 5 && duration) {
        lastSavedRef.current = current;
        onProgress?.(current, duration, false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [current, duration, onProgress]);

  useEffect(() => {
    function onVisibility() { if (document.hidden) saveNow(); }
    function onPageHide() { saveNow(); }
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      saveNow();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function togglePlay() {
    if (isYoutube) {
      const p = ytPlayerRef.current;
      if (!p) return;
      playing ? p.pauseVideo() : p.playVideo();
    } else {
      const v = videoRef.current;
      playing ? v.pause() : v.play();
    }
  }

  function seekTo(t) {
    if (isYoutube) ytPlayerRef.current?.seekTo(t, true);
    else if (videoRef.current) videoRef.current.currentTime = t;
    setCurrent(t);
  }

  function seekBy(delta) {
    seekTo(Math.max(0, Math.min(duration, current + delta)));
  }

  function setVideoVolume(v) {
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    if (isYoutube) ytPlayerRef.current?.setVolume?.(v * 100);
  }

  function setPlaybackRate(r) {
    setRate(r);
    if (videoRef.current) videoRef.current.playbackRate = r;
    if (isYoutube) ytPlayerRef.current?.setPlaybackRate?.(r);
  }

  function setQuality(levelIndex) {
    if (hlsRef.current) hlsRef.current.currentLevel = levelIndex;
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function togglePip() {
    if (document.pictureInPictureElement) document.exitPictureInPicture?.();
    else videoRef.current?.requestPictureInPicture?.();
  }

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowRight') seekBy(10);
      if (e.key === 'ArrowLeft') seekBy(-10);
      if (e.key.toLowerCase() === 'f') toggleFullscreen();
      if (e.key.toLowerCase() === 'm') setVideoVolume(volume > 0 ? 0 : 1);
      showControls();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, current, duration, volume]);

  function onTouchEnd(e) {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.changedTouches[0].clientX - rect.left;
    const side = x < rect.width / 2 ? 'left' : 'right';
    const now = Date.now();
    if (lastTapRef.current.side === side && now - lastTapRef.current.t < 300) {
      seekBy(side === 'left' ? -10 : 10);
    }
    lastTapRef.current = { t: now, side };
    showControls();
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black z-[200]"
      onMouseMove={showControls}
      onTouchEnd={onTouchEnd}
    >
      {isYoutube ? (
        <div id="yt-target" className="w-full h-full" />
      ) : (
        <video ref={videoRef} className="w-full h-full" playsInline autoPlay onClick={togglePlay} />
      )}

      <button
        onClick={onBack}
        aria-label="Back"
        className={`absolute z-10 top-[calc(16px+env(safe-area-inset-top,0px))] left-4 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center transition-opacity ${controlsVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-white fill-none stroke-2"><path d="M15 19l-7-7 7-7" /></svg>
      </button>

      <div
        className={`absolute bottom-0 left-0 right-0 px-5 pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-10 transition-opacity ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.85), transparent)' }}
      >
        {(title || subtitle) && (
          <div className="mb-2 text-white">
            <div className="text-sm font-semibold">{title}</div>
            {subtitle && <div className="text-xs text-white/70">{subtitle}</div>}
          </div>
        )}
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={current}
          onChange={(e) => seekTo(Number(e.target.value))}
          className="w-full accent-red mb-2"
        />
        <div className="flex items-center gap-4 text-white">
          <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? '❚❚' : '▶'}
          </button>
          <span className="text-xs">{formatTime(current)} / {formatTime(duration)}</span>
          <div className="flex-1" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVideoVolume(Number(e.target.value))}
            className="w-20 accent-red"
            aria-label="Volume"
          />
          <select
            value={rate}
            onChange={(e) => setPlaybackRate(Number(e.target.value))}
            className="bg-transparent text-xs border border-white/30 rounded px-1.5 py-1"
          >
            {[0.5, 1, 1.25, 1.5, 2].map((r) => (
              <option key={r} value={r} className="text-black">{r}×</option>
            ))}
          </select>
          {levels.length > 0 && (
            <select
              value={activeLevel}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="bg-transparent text-xs border border-white/30 rounded px-1.5 py-1"
            >
              <option value={-1} className="text-black">Auto</option>
              {levels.map((lvl, i) => (
                <option key={i} value={i} className="text-black">{lvl.height}p</option>
              ))}
            </select>
          )}
          {!isYoutube && (
            <button onClick={togglePip} aria-label="Picture in picture" className="text-xs">PiP</button>
          )}
          <button onClick={toggleFullscreen} aria-label="Fullscreen" className="text-xs">⛶</button>
        </div>
      </div>
    </div>
  );
}
