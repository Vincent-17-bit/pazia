import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { grad } from './PosterCard.jsx';

export default function EpisodeList({ mediaType, id, seasonNumber, onPlayEpisode }) {
  const [page, setPage] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
    setEpisodes([]);
    setLoading(true);
  }, [seasonNumber]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.season(id, seasonNumber, page).then((r) => {
      if (cancelled) return;
      setEpisodes((prev) => (page === 1 ? r.episodes : [...prev, ...r.episodes]));
      setHasMore(r.hasMore);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id, seasonNumber, page]);

  return (
    <div className="space-y-3">
      {episodes.map((ep) => (
        <button
          key={ep.episodeNumber}
          onClick={() => onPlayEpisode(seasonNumber, ep.episodeNumber)}
          className="flex gap-3 p-2 rounded-lg hover:bg-surface w-full text-left"
        >
          <div
            className="w-[120px] h-[68px] rounded-md bg-cover bg-center flex-none relative"
            style={{ backgroundImage: ep.stillPath ? `url(${ep.stillPath})` : grad(ep.episodeNumber) }}
          >
            <span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 rounded-md text-xs">▶</span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{ep.episodeNumber}. {ep.name}</div>
            <div className="text-xs text-inkdim">{ep.runtime ? `${ep.runtime}m` : ''} {ep.airDate}</div>
            <div className="text-xs text-inkdim line-clamp-2 mt-1">{ep.overview}</div>
          </div>
        </button>
      ))}
      {loading && <div className="text-xs text-inkdim py-2">Loading episodes…</div>}
      {!loading && hasMore && (
        <button onClick={() => setPage((p) => p + 1)} className="text-xs text-inkdim border border-line rounded-full px-4 py-2">
          Load more episodes
        </button>
      )}
    </div>
  );
}
