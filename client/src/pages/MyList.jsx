import { useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useMyList } from '../context/MyListContext.jsx';
import PosterCard from '../components/PosterCard.jsx';
import MyListButton from '../components/MyListButton.jsx';

const WRAP = 'flex flex-wrap gap-3.5';
const CELL_W = 'w-[112px] sm:w-[132px] md:w-[152px] lg:w-[172px] xl:w-[188px]';

export default function MyList() {
  const { items, synced } = useMyList();
  const sorted = [...items].sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));

  const results = useQueries({
    queries: sorted.map((it) => ({
      queryKey: ['title', it.mediaType, it.tmdbId],
      queryFn: () => api.title(it.mediaType, it.tmdbId),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });

  return (
    <div className="px-5 pt-[calc(120px+env(safe-area-inset-top,0px))] pb-16">
      <h1 className="text-xl font-bold mb-5">My List</h1>

      {!synced && (
        <div className={WRAP}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${CELL_W} aspect-[2/3] rounded-lg bg-surface animate-pulse`} />
          ))}
        </div>
      )}

      {synced && sorted.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-inkdim mb-5 max-w-xs mx-auto">
            Nothing saved yet. Tap + on any title to add it here.
          </p>
          <Link to="/" className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-bg">
            Browse titles
          </Link>
        </div>
      )}

      {synced && sorted.length > 0 && (
        <div className={WRAP}>
          {sorted.map((it, i) => {
            const q = results[i];
            const key = `${it.mediaType}-${it.tmdbId}`;

            if (q.isLoading) {
              return <div key={key} className={`${CELL_W} aspect-[2/3] rounded-lg bg-surface animate-pulse`} />;
            }

            const item = q.data;
            const available = !q.isError && item && item.hasLicensedSource !== false;

            return (
              <div key={key} className={`relative ${CELL_W}`}>
                {item ? (
                  <div className={available ? '' : 'grayscale opacity-50 pointer-events-none'}>
                    <PosterCard item={item} />
                  </div>
                ) : (
                  <div className="aspect-[2/3] rounded-lg bg-surface border border-line opacity-50" />
                )}

                {!available && (
                  <span className="absolute bottom-2 left-2 right-2 text-[10px] font-semibold text-white bg-black/80 rounded px-1.5 py-0.5 truncate">
                    No longer available
                  </span>
                )}

                <MyListButton
                  mediaType={it.mediaType}
                  tmdbId={it.tmdbId}
                  variant="icon"
                  size="sm"
                  className="absolute top-1.5 right-1.5 z-10 bg-black/60"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
