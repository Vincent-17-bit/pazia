import { useEffect, useRef, useState } from 'react';
import { grad } from './PosterCard.jsx';

let ytApiPromise = null;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

const HIDE_DELAY = 2500;

export default function TitleHeroMedia({ backdropPath, colorSeed, trailerKey, heightClass, onClose }) {
  const [showTrailer, setShowTrailer] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(false);

  const timers = useRef([]);
  const hideTimerRef = useRef(null);
  const playerRef = useRef(null);
  const ytTargetRef = useRef(null);
  const engagedRef = useRef(false);
  const prefersHoverRef = useRef(true);

  useEffect(() => {
    prefersHoverRef.current = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? true;
  }, []);

  useEffect(() => {
    engagedRef.current = engaged;
  }, [engaged]);

  // reset fully whenever the trailer changes / modal reopens
  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    clearTimeout(hideTimerRef.current);
    setShowTrailer(false);
    setFadeOut(false);
    setEngaged(false);
    setIsPlaying(false);
    setIsMuted(true);
    setControlsVisible(false);
    playerRef.current?.destroy?.();
    playerRef.current = null;
    if (!trailerKey) return;
    timers.current.push(setTimeout(() => setShowTrailer(true), 800));
    timers.current.push(setTimeout(() => setFadeOut(true), 800));
    return () => timers.current.forEach(clearTimeout);
  }, [trailerKey]);

  // create the real YT player once the trailer area is ready
  useEffect(() => {
    if (!showTrailer || !trailerKey || !ytTargetRef.current) return;
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !ytTargetRef.current) return;
      playerRef.current = new YT.Player(ytTargetRef.current, {
        videoId: trailerKey,
        playerVars: { autoplay: 1, mute: 1, controls: 0, modestbranding: 1, playsinline: 1, rel: 0 },
        events: {
          onReady: (e) => {
            const ifr = e.target.getIframe?.();
            if (ifr) {
              ifr.style.position = 'absolute';
              ifr.style.inset = '0';
              ifr.style.width = '100%';
              ifr.style.height = '100%';
            }
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
            if (e.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
            if (e.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              // ambient preview loops silently; once engaged, stay on the last frame so Play can replay from 0
              if (!engagedRef.current) {
                e.target.seekTo(0);
                e.target.playVideo();
              }
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTrailer, trailerKey]);

  // Space / M shortcuts, scoped to while the trailer is engaged
  useEffect(() => {
    if (!engaged) return;
    function onKeyDown(e) {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engaged, isPlaying, isMuted]);

  function revealControls() {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), HIDE_DELAY);
  }

  function togglePlay(e) {
    e?.stopPropagation();
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) p.pauseVideo();
    else p.playVideo();
  }

  function toggleMute(e) {
    e?.stopPropagation();
    const p = playerRef.current;
    if (!p) return;
    if (isMuted) {
      p.unMute();
      setIsMuted(false);
    } else {
      p.mute();
      setIsMuted(true);
    }
  }

  function startEngaged(e) {
    e.stopPropagation();
    setEngaged(true);
    setIsMuted(false);
    const p = playerRef.current;
    if (p) {
      p.unMute();
      p.playVideo();
    }
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), HIDE_DELAY);
  }

  function onAreaMouseEnter() {
    if (!engaged || !prefersHoverRef.current) return;
    revealControls();
  }
  function onAreaMouseMove() {
    if (!engaged || !prefersHoverRef.current) return;
    revealControls();
  }
  function onAreaMouseLeave() {
    if (!engaged || !prefersHoverRef.current) return;
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 600);
  }
  function onAreaClick() {
    if (!engaged) return;
    if (prefersHoverRef.current) {
      togglePlay();
      revealControls();
    } else {
      setControlsVisible((v) => {
        const next = !v;
        clearTimeout(hideTimerRef.current);
        if (next) hideTimerRef.current = setTimeout(() => setControlsVisible(false), HIDE_DELAY);
        return next;
      });
    }
  }

  const bg = backdropPath ? `url(${backdropPath})` : grad(colorSeed ?? 0);

  return (
    <div
      className={`relative ${heightClass} overflow-hidden`}
      onMouseEnter={onAreaMouseEnter}
      onMouseMove={onAreaMouseMove}
      onMouseLeave={onAreaMouseLeave}
      onClick={onAreaClick}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] animate-kenburns"
        style={{
          backgroundImage: bg,
          opacity: fadeOut ? 0 : 1,
        }}
      />
      {showTrailer && (
        <div
          ref={ytTargetRef}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: engaged ? 'auto' : 'none' }}
        />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, var(--bg) 0%, transparent 45%)' }} />

      {trailerKey && !engaged && (
        <button
          onClick={startEngaged}
          aria-label="Play Trailer"
          title="▶ Play Trailer"
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 ml-1" fill="white"><path d="M8 5v14l11-7z" /></svg>
        </button>
      )}

      {engaged && (
        <div
          className={`absolute bottom-4 right-4 z-10 flex items-center gap-2 transition-opacity duration-200 ${
            controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause trailer' : 'Play trailer'}
            className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4 ml-0.5" fill="white"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute trailer' : 'Mute trailer'}
            className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center"
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M4 9v6h4l5 5V4L8 9H4z" fill="white" />
                <path d="M16 9l6 6M22 9l-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M4 9v6h4l5 5V4L8 9H4z" fill="white" />
                <path d="M16 8a5 5 0 010 8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M18.5 5.5a9 9 0 010 13" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
              </svg>
            )}
          </button>
        </div>
      )}

      {onClose && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label="Close"
          className="absolute z-20 top-[calc(16px+env(safe-area-inset-top,0px))] right-4 w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none stroke-2"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      )}
    </div>
  );
}
