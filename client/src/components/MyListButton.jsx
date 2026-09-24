import { useState } from 'react';
import { useMyList } from '../context/MyListContext.jsx';

const ICON_SIZE = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5' };
const BTN_SIZE = { sm: 'w-7 h-7', md: 'min-w-[44px] min-h-[44px]' };

function Icon({ inList, className }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} stroke-current fill-none stroke-2`}>
      {inList ? <path d="M5 13l4 4L19 7" /> : <path d="M12 5v14M5 12h14" />}
    </svg>
  );
}

// Reads/writes the single MyListContext source of truth. Every instance of
// this button for the same title stays in sync since they all share it.
export default function MyListButton({ mediaType, tmdbId, variant = 'icon', size = 'sm', bordered = true, className = '' }) {
  const { has, toggle, isPending } = useMyList();
  const [pop, setPop] = useState(false);
  const inList = has(mediaType, tmdbId);
  const pending = isPending(mediaType, tmdbId);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPop(true);
    setTimeout(() => setPop(false), 150);
    toggle(mediaType, tmdbId);
  }

  const label = inList ? 'Remove from My List' : 'Add to My List';

  if (variant === 'pill') {
    return (
      <button
        onClick={onClick}
        disabled={pending}
        aria-label={label}
        aria-pressed={inList}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border flex-none disabled:opacity-60 transition-colors ${
          inList ? 'bg-red border-red' : 'bg-white/10 border-white/25'
        } ${className}`}
      >
        <Icon inList={inList} className={`w-4 h-4 ${pop ? 'animate-scale-pop' : ''}`} />
        {inList ? 'Added' : 'My List'}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      aria-label={label}
      aria-pressed={inList}
      className={`${BTN_SIZE[size]} rounded-full flex items-center justify-center disabled:opacity-60 transition-colors ${
        bordered ? `border ${inList ? 'border-red bg-red/20' : 'border-white/50'}` : ''
      } ${className}`}
    >
      <Icon inList={inList} className={`${ICON_SIZE[size]} ${inList && !bordered ? 'text-red' : ''} ${pop ? 'animate-scale-pop' : ''}`} />
    </button>
  );
}
