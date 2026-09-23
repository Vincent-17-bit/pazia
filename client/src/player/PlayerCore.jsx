import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Adapter boundary: swap HLS/MP4/YouTube here without touching controls UI.
const PlayerCore = forwardRef(function PlayerCore(
  { source, startAt = 0, onState, onEnded, onSaveNow },
  ref
) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const ytRef = useRef(null);
  const ytIntervalRef = useRef(null);
  const currentRef = useRef(0);
  const durationRef = useRef(0);
  const isYoutube = source.type === 'youtube';

  function emit(patch) {
    onState?.(patch);
  }

  function saveNow(final = false) {
    const pos = isYoutube ? ytRef.current?.getCurrentTime?.() : videoRef.current?.currentTime;
    const dur = isYoutube ? ytRef.current?.getDuration?.() : videoRef.current?.duration;
    if (pos != null && dur) onSaveNow?.(pos, dur, final);
  }

  useImperativeHandle(ref, () => ({
    play() {
      isYoutube ? ytRef.current?.playVideo() : videoRef.current?.play();
    },
    pause() {
      isYoutube ? ytRef.current?.pauseVideo() : videoRef.current?.pause();
    },
    seekTo(t) {
      if (isYoutube) ytRef.current?.seekTo(t, true);
      else if (videoRef.current) videoRef.current.currentTime = t;
      emit({ current: t });
    },
    setVolume(v) {
      if (videoRef.current) videoRef.current.volume = v;
      if (isYoutube) ytRef.current?.setVolume?.(v * 100);
    },
    setMuted(m) {
      if (videoRef.current) videoRef.current.muted = m;
      if (isYoutube) (m ? ytRef.current?.mute() : ytRef.current?.unMute());
    },
    setRate(r) {
      if (videoRef.current) videoRef.current.playbackRate = r;
      if (isYoutube) ytRef.current?.setPlaybackRate?.(r);
    },
    setQuality(levelIndex) {
      if (hlsRef.current) hlsRef.current.currentLevel = levelIndex;
    },
    setAudioTrack(index) {
      if (hlsRef.current) hlsRef.current.audioTrack = index;
    },
    getVideoEl: () => videoRef.current,
    saveNow,
  }));

  // HLS / MP4
  useEffect(() => {
    if (isYoutube) return;
    const video = videoRef.current;
    if (!video) return;
    let cleanup = () => {};

    if (source.type === 'hls' && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source.url;
    } else if (source.type === 'hls') {
      import('hls.js').then(({ default: Hls }) => {
        if (!Hls.isSupported()) { video.src = source.url; return; }
        const hls = new Hls({ capLevelToPlayerSize: true, startLevel: -1 });
        hls.loadSource(source.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          emit({ levels: data.levels || [] });
          const tracks = hls.audioTracks || [];
          if (tracks.length > 1) emit({ audioTracks: tracks, activeAudioTrack: hls.audioTrack });
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => emit({ activeLevel: data.level }));
        hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_, data) => emit({ activeAudioTrack: data.id }));
        hlsRef.current = hls;
        cleanup = () => hls.destroy();
      });
    } else {
      video.src = source.url;
    }
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, isYoutube]);

  useEffect(() => {
    if (isYoutube) return;
    const video = videoRef.current;
    if (!video) return;

    function onLoaded() {
      durationRef.current = video.duration;
      emit({ duration: video.duration, pipAvailable: 'pictureInPictureEnabled' in document });
      if (startAt > 0) video.currentTime = startAt;
    }
    function onTime() {
      currentRef.current = video.currentTime;
      emit({ current: video.currentTime, buffered: video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0 });
    }
    function onPlay() { emit({ playing: true }); }
    function onPause() { emit({ playing: false }); saveNow(); }
    function onEndedEvt() { saveNow(true); onEnded?.(); }
    function onVolume() { emit({ volume: video.volume, muted: video.muted }); }

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEndedEvt);
    video.addEventListener('volumechange', onVolume);
    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEndedEvt);
      video.removeEventListener('volumechange', onVolume);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isYoutube, startAt]);

  // YouTube
  useEffect(() => {
    if (!isYoutube) return;
    function init() {
      ytRef.current = new window.YT.Player(document.getElementById('yt-target'), {
        videoId: source.videoId,
        playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0, start: Math.floor(startAt) },
        events: {
          onReady: (e) => {
            durationRef.current = e.target.getDuration();
            emit({ duration: durationRef.current, pipAvailable: false });
            e.target.playVideo();
          },
          onStateChange: (e) => {
            emit({ playing: e.data === window.YT.PlayerState.PLAYING });
            if (e.data === window.YT.PlayerState.ENDED) { saveNow(true); onEnded?.(); }
          },
        },
      });
      ytIntervalRef.current = setInterval(() => {
        const p = ytRef.current;
        if (p && p.getCurrentTime) {
          currentRef.current = p.getCurrentTime();
          emit({ current: currentRef.current });
        }
      }, 500);
    }
    if (window.YT && window.YT.Player) init();
    else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); init(); };
    }
    return () => {
      clearInterval(ytIntervalRef.current);
      ytRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isYoutube, source, startAt]);

  // periodic + lifecycle persistence
  const lastSavedRef = useRef(0);
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.abs(currentRef.current - lastSavedRef.current) >= 5 && durationRef.current) {
        lastSavedRef.current = currentRef.current;
        onSaveNow?.(currentRef.current, durationRef.current, false);
      }
    }, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onVisibility() { if (document.hidden) saveNow(true); }
    function onPageHide() {
      const pos = isYoutube ? ytRef.current?.getCurrentTime?.() : videoRef.current?.currentTime;
      const dur = isYoutube ? ytRef.current?.getDuration?.() : videoRef.current?.duration;
      if (pos != null && dur && navigator.sendBeacon) {
        onSaveNow?.(pos, dur, true, true);
      } else saveNow(true);
    }
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      saveNow(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isYoutube ? (
    <div id="yt-target" className="w-full h-full" />
  ) : (
    <video ref={videoRef} className="w-full h-full" playsInline autoPlay />
  );
});

export default PlayerCore;
