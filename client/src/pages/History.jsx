import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { grad } from '../components/PosterCard.jsx';

export default function History() {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['history'], queryFn: () => api.history().then((r) => r.items) });

  async function remove(mediaType, tmdbId) {
    await api.removeFromHistory(mediaType, tmdbId);
    qc.invalidateQueries({ queryKey: ['history'] });
    qc.invalidateQueries({ queryKey: ['continue-watching'] });
  }

  return (
    <div className="px-5 pt-[calc(120px+env(safe-area-inset-top,0px))] pb-16">
      <h1 className="text-xl font-bold mb-5">History</h1>
      {query.data?.length === 0 && <p className="text-sm text-inkdim">No watch history yet.</p>}
      <div className="space-y-3">
        {query.data?.map((h) => (
          <div key={`${h.mediaType}-${h.tmdbId}-${h.season ?? ''}-${h.episode ?? ''}-${h.watchedAt}`} className="flex items-center gap-3">
            <Link to={`/title/${h.mediaType}/${h.tmdbId}`}>
              <div className="w-16 h-16 rounded-lg" style={{ background: grad(h.tmdbId.length) }} />
            </Link>
            <div className="flex-1 text-sm">
              {h.tmdbId}
              {h.season && <span className="text-inkdim"> · S{h.season} · E{h.episode}</span>}
            </div>
            <button onClick={() => remove(h.mediaType, h.tmdbId)} className="text-xs text-inkdim underline">
              Remove from Continue Watching
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
