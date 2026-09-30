import { useEffect, useRef } from 'react';

let ytApiPromise = null;
function loadYouTubeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT); };
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

// Official YouTube embedded player for ingested content: native controls,
// no custom overlay drawn on top, autoplay off by default. We only attach
// the IFrame API to read position/duration for resume-watching, same as
// polling a native <video> element - we never call any control method on
// it (no play/pause/seek), so nothing here can interfere with the
// player's own UI.
export default function YoutubeEmbedPlayer({ videoId, startAt = 0, onBack, onEnded, onSaveNow }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let interval = null;

    function save(final, keepalive) {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      const pos = p.getCurrentTime();
      const dur = p.getDuration();
      if (dur) onSaveNow?.(pos, dur, final, keepalive);
    }

    loadYouTubeApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new YT.Player(hostRef.current, {
        videoId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start: Math.max(0, Math.floor(startAt)),
        },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) {
              save(true, false);
              onEnded?.();
            }
          },
        },
      });
      interval = setInterval(() => save(false, false), 5000);
    });

    function onPageHide() { save(false, true); }
    window.addEventListener('pagehide', onPageHide);

    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', onPageHide);
      clearInterval(interval);
      save(false, true);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div className="fixed inset-0 bg-black z-[200]">
      <button
        onClick={onBack}
        className="absolute top-[calc(16px+env(safe-area-inset-top,0px))] left-4 z-10 w-9 h-9 min-w-[44px] min-h-[44px] rounded-full bg-white/10 flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-white fill-none stroke-2"><path d="M15 19l-7-7 7-7" /></svg>
      </button>
      <div ref={hostRef} className="w-full h-full min-w-[200px] min-h-[200px]" />
    </div>
  );
}
