import { useMyList } from '../context/MyListContext.jsx';
import { Link } from 'react-router-dom';
import { grad } from '../components/PosterCard.jsx';

export default function MyList() {
  const { items, toggle } = useMyList();

  return (
    <div className="px-5 pt-[calc(120px+env(safe-area-inset-top,0px))] pb-16">
      <h1 className="text-xl font-bold mb-5">My List</h1>
      {items.length === 0 && <p className="text-sm text-inkdim">Nothing saved yet. Tap + My List on a title to add it here.</p>}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(132px,1fr))' }}>
        {items.map((it) => (
          <div key={`${it.mediaType}-${it.tmdbId}`}>
            <Link to={`/title/${it.mediaType}/${it.tmdbId}`}>
              <div className="w-full h-[198px] rounded-lg" style={{ background: grad(it.tmdbId.length) }} />
            </Link>
            <button
              onClick={() => toggle(it.mediaType, it.tmdbId)}
              className="text-xs text-inkdim mt-1.5 underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
