import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useRatings } from '../context/RatingsContext.jsx';
import { useHoverIntent } from '../hooks/useHoverIntent.js';
import MyListButton from './MyListButton.jsx';

const GRADIENTS = [
  ['#3a0d10', '#0b0b0f'], ['#4a1116', '#1a0508'], ['#2a0a10', '#0b0b0f'],
  ['#5c1018', '#120306'], ['#331013', '#0b0b0f'], ['#421015', '#150507'],
];
function grad(seed = 0) {
  const [a, b] = GRADIENTS[seed % GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

export default function PosterCard({ item, wide = false, onItemClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { get: getRating, rate } = useRatings();
  const { active: previewing, onEnter, onLeave, supportsHover } = useHoverIntent(500);
  const rating = getRating(item.mediaType, item.id);

  const bg = item.posterPath ? `url(${item.posterPath})` : grad(item.colorSeed ?? item.id?.length ?? 0);
  const to = `/title/${item.mediaType}/${item.id}`;

  const previewQuery = useQuery({
    queryKey: ['title', item.mediaType, item.id],
    queryFn: () => api.title(item.mediaType, item.id),
    enabled: previewing && supportsHover,
    staleTime: 10 * 60 * 1000,
  });
  const trailerKey = previewQuery.data?.trailerKey;

  function openModal(e) {
    e.preventDefault();
    e.stopPropagation();
    if (onItemClick) onItemClick(item);
    else navigate(to, { state: { background: location } });
  }
  function onPlay(e) {
    e.preventDefault();
    e.stopPropagation();
    navigate(item.mediaType === 'movie' ? `/watch/movie/${item.id}` : `/watch/tv/${item.id}?season=1&episode=1`);
  }
  function onRate(e, value) {
    e.preventDefault();
    e.stopPropagation();
    rate(item.mediaType, item.id, value);
  }

  return (
    <Link
      to={to}
      state={onItemClick ? undefined : { background: location }}
      onClick={onItemClick ? (e) => { e.preventDefault(); onItemClick(item); } : undefined}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={`group relative flex-none ${
        wide ? 'w-[170px] sm:w-[190px] md:w-[210px] lg:w-[230px]' : 'w-[112px] sm:w-[132px] md:w-[152px] lg:w-[172px] xl:w-[188px]'
      }`}
    >
      <div
        className={`relative rounded-lg bg-cover bg-center flex items-end p-2 overflow-hidden transition-all duration-300 ${wide ? 'aspect-[210/118]' : 'aspect-[2/3]'} ${
          previewing ? 'scale-[1.35] z-30 shadow-2xl shadow-black/60' : 'group-hover:scale-[1.08]'
        }`}
        style={{ backgroundImage: bg }}
      >
        {!item.posterPath && (
          <span className="text-[11px] font-semibold text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
            {item.title}
          </span>
        )}

        {previewing && trailerKey && (
          <iframe
            className="absolute inset-0 w-full h-full pointer-events-none"
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&loop=1&playlist=${trailerKey}&controls=0&modestbranding=1&playsinline=1`}
            title=""
            allow="autoplay; encrypted-media"
          />
        )}

        {previewing && (
          <div
            className="absolute inset-0 flex flex-col justify-end p-2.5"
            style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.15) 55%, transparent 75%)' }}
          >
            <div className="text-xs font-semibold mb-2 line-clamp-1 [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
              {item.title}
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={onPlay} aria-label="Play" className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 ml-0.5" fill="black"><path d="M8 5v14l11-7z" /></svg>
              </button>
              <MyListButton mediaType={item.mediaType} tmdbId={item.id} variant="icon" size="sm" />
              <button onClick={(e) => onRate(e, 'up')} aria-label="Thumbs up" className={`w-7 h-7 rounded-full border flex items-center justify-center ${rating === 'up' ? 'border-red bg-red/20' : 'border-white/50'}`}>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-white fill-none stroke-2"><path d="M7 11v9H4v-9h3zm0 0l4-8a2 2 0 012 2v5h5a2 2 0 012 2l-1.5 6a2 2 0 01-2 1.5H7" /></svg>
              </button>
              <button onClick={(e) => onRate(e, 'down')} aria-label="Thumbs down" className={`w-7 h-7 rounded-full border flex items-center justify-center ${rating === 'down' ? 'border-red bg-red/20' : 'border-white/50'}`}>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-white fill-none stroke-2" style={{ transform: 'rotate(180deg)' }}><path d="M7 11v9H4v-9h3zm0 0l4-8a2 2 0 012 2v5h5a2 2 0 012 2l-1.5 6a2 2 0 01-2 1.5H7" /></svg>
              </button>
              <button onClick={openModal} aria-label="More info" className="w-7 h-7 rounded-full border border-white/50 flex items-center justify-center ml-auto">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-white fill-none stroke-2"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export { grad };
