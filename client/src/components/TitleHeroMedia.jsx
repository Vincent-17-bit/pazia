import { useEffect, useRef, useState } from 'react';
import { grad } from './PosterCard.jsx';

export default function TitleHeroMedia({ backdropPath, colorSeed, trailerKey, heightClass, onClose }) {
  const [showTrailer, setShowTrailer] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [playing, setPlaying] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setShowTrailer(false);
    setFadeOut(false);
    setPlaying(false);
    if (!trailerKey) return;
    timers.current.push(setTimeout(() => setShowTrailer(true), 800));
    timers.current.push(setTimeout(() => setFadeOut(true), 800));
    return () => timers.current.forEach(clearTimeout);
  }, [trailerKey]);

  const bg = backdropPath ? `url(${backdropPath})` : grad(colorSeed ?? 0);

  return (
    <div className={`relative ${heightClass} overflow-hidden`}>
      <div
        className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] animate-kenburns"
        style={{
          backgroundImage: bg,
          opacity: fadeOut ? 0 : 1,
        }}
      />
      {showTrailer && (
        <iframe
          className="absolute inset-0 w-full h-full pointer-events-none"
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=${playing ? 0 : 1}&loop=1&playlist=${trailerKey}&controls=${playing ? 1 : 0}&modestbranding=1&playsinline=1`}
          title="Trailer background"
          allow="autoplay; encrypted-media"
          style={{ pointerEvents: playing ? 'auto' : 'none' }}
        />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, var(--bg) 0%, transparent 45%)' }} />

      {trailerKey && !playing && (
        <button
          onClick={() => setPlaying(true)}
          aria-label="Play Trailer"
          title="▶ Play Trailer"
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 ml-1" fill="white"><path d="M8 5v14l11-7z" /></svg>
        </button>
      )}

      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute z-20 top-[calc(16px+env(safe-area-inset-top,0px))] right-4 w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-white fill-none stroke-2"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      )}
    </div>
  );
}
