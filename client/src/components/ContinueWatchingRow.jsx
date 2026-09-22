import { Link } from 'react-router-dom';
import { grad } from './PosterCard.jsx';

export default function ContinueWatchingRow({ items, loading, onSeedDemo }) {
  if (loading) {
    return (
      <section className="pt-5 pb-1.5">
        <div className="px-5 pb-3"><h2 className="text-[17px] font-semibold">Continue Watching</h2></div>
        <div className="flex gap-3 px-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-none w-[210px] h-[118px] rounded-lg bg-surface2 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!items?.length) {
    if (!import.meta.env.DEV) return null;
    return (
      <section className="pt-5 pb-1.5 px-5">
        <h2 className="text-[17px] font-semibold mb-3">Continue Watching</h2>
        <button onClick={onSeedDemo} className="text-xs px-3 py-1.5 rounded-full border border-line text-inkdim">
          Seed demo progress
        </button>
      </section>
    );
  }

  return (
    <section className="pt-5 pb-1.5">
      <div className="flex items-baseline justify-between px-5 pb-3">
        <h2 className="text-[17px] font-semibold">Continue Watching</h2>
        {import.meta.env.DEV && (
          <button onClick={onSeedDemo} className="text-xs px-3 py-1.5 rounded-full border border-line text-inkdim">
            Seed demo
          </button>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-1.5">
        {items.map((it) => {
          const bg = it.posterPath ? `url(${it.posterPath})` : grad(it.colorSeed ?? 0);
          const href = it.season
            ? `/watch/${it.mediaType}/${it.id}?season=${it.season}&episode=${it.episode}`
            : `/watch/${it.mediaType}/${it.id}`;
          return (
            <Link key={`${it.mediaType}-${it.id}-${it.season ?? ''}-${it.episode ?? ''}`} to={href} className="flex-none w-[210px]">
              <div className="relative w-[210px] h-[118px] rounded-lg bg-cover bg-center overflow-hidden" style={{ backgroundImage: bg }}>
                <div className="absolute left-0 right-0 bottom-0 h-[3px] bg-white/20">
                  <div className="h-full bg-red" style={{ width: `${it.progressPct}%` }} />
                </div>
              </div>
              <div className="text-[11px] text-inkdim mt-1.5">
                {it.title}{it.label ? ` · ${it.label}` : ''}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
