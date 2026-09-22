import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { grad } from '../components/PosterCard.jsx';
import Row from '../components/Row.jsx';
import { useMyList } from '../context/MyListContext.jsx';

function TrailerModal({ videoKey, onClose }) {
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
    }
    function onEsc(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-3xl aspect-video" onClick={(e) => e.stopPropagation()}>
        <iframe
          className="w-full h-full rounded-lg"
          src={`https://www.youtube.com/embed/${videoKey}?autoplay=1`}
          title="Trailer"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
      <button onClick={onClose} aria-label="Close trailer" className="absolute top-5 right-5 text-white text-2xl">×</button>
    </div>
  );
}

function EpisodeList({ mediaType, id, seasonNumber }) {
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
        <Link
          key={ep.episodeNumber}
          to={`/watch/${mediaType}/${id}?season=${seasonNumber}&episode=${ep.episodeNumber}`}
          className="flex gap-3 p-2 rounded-lg hover:bg-surface"
        >
          <div
            className="w-[120px] h-[68px] rounded-md bg-cover bg-center flex-none"
            style={{ backgroundImage: ep.stillPath ? `url(${ep.stillPath})` : grad(ep.episodeNumber) }}
          />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{ep.episodeNumber}. {ep.name}</div>
            <div className="text-xs text-inkdim">{ep.runtime ? `${ep.runtime}m` : ''} {ep.airDate}</div>
            <div className="text-xs text-inkdim line-clamp-2 mt-1">{ep.overview}</div>
          </div>
        </Link>
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

export default function TitleDetail() {
  const { mediaType, id } = useParams();
  const navigate = useNavigate();
  const { has, toggle } = useMyList();
  const [season, setSeason] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);

  const query = useQuery({
    queryKey: ['title', mediaType, id],
    queryFn: () => api.title(mediaType, id),
  });

  useEffect(() => {
    if (query.data?.seasons?.length && season === null) {
      setSeason(query.data.seasons[query.data.seasons.length - 1].seasonNumber);
    }
  }, [query.data, season]);

  if (query.isLoading) {
    return <div className="pt-[calc(120px+env(safe-area-inset-top,0px))] px-5 text-inkdim text-sm">Loading…</div>;
  }
  if (query.isError || !query.data) {
    return <div className="pt-[calc(120px+env(safe-area-inset-top,0px))] px-5 text-inkdim text-sm">Couldn't load this title.</div>;
  }

  const item = query.data;
  const bg = item.backdropPath ? `url(${item.backdropPath})` : grad(item.colorSeed ?? 0);
  const inList = has(item.mediaType, item.id);

  function onPlay() {
    if (item.hasLicensedSource) {
      navigate(`/watch/${item.mediaType}/${item.id}`);
    } else {
      document.getElementById('where-to-watch')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <div className="pb-16">
      <div className="relative h-[42vh] min-h-[280px]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: bg }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, var(--bg), transparent 60%)' }} />
        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="absolute z-10 top-[calc(16px+env(safe-area-inset-top,0px))] left-4 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-white fill-none stroke-2"><path d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>

      <div className="px-5 -mt-10 relative z-10">
        <h1 className="text-2xl font-bold mb-1.5">{item.title}</h1>
        <div className="flex gap-2 items-center text-[13px] text-inkdim mb-3">
          <span>{item.year}</span><span>·</span><span>★ {item.rating}</span>
          {item.runtime && <><span>·</span><span>{item.runtime}m</span></>}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {item.genres?.map((g) => (
            <span key={g} className="text-xs px-3 py-1 rounded-full border border-line text-inkdim">{g}</span>
          ))}
        </div>
        <p className="text-sm text-[#d4d4d8] leading-relaxed mb-5">{item.overview}</p>

        <div className="flex gap-3 mb-8 flex-wrap">
          <button onClick={onPlay} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-bg">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            Play
          </button>
          <button
            onClick={() => toggle(item.mediaType, item.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border ${inList ? 'bg-red border-red' : 'bg-white/10 border-white/25'}`}
          >
            {inList ? '✓ In My List' : '+ My List'}
          </button>
          {item.trailers?.[0] && (
            <button onClick={() => setTrailerKey(item.trailers[0].key)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white/10 border border-white/25">
              ▶ Trailer
            </button>
          )}
        </div>

        {item.cast?.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[17px] font-semibold mb-3">Cast</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {item.cast.map((c) => (
                <div key={c.name} className="flex-none w-20 text-center">
                  <div
                    className="w-20 h-20 rounded-full bg-cover bg-center mb-1.5"
                    style={{ backgroundImage: c.profilePath ? `url(${c.profilePath})` : grad(c.name.length) }}
                  />
                  <div className="text-xs truncate">{c.name}</div>
                  <div className="text-[11px] text-inkdim truncate">{c.character}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.mediaType === 'tv' && item.seasons?.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[17px] font-semibold">Episodes</h2>
              <select
                value={season ?? ''}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="bg-surface border border-line rounded-md px-3 py-1.5 text-sm"
              >
                {item.seasons.map((s) => (
                  <option key={s.seasonNumber} value={s.seasonNumber}>{s.name}</option>
                ))}
              </select>
            </div>
            {season !== null && <EpisodeList mediaType={item.mediaType} id={item.id} seasonNumber={season} />}
          </div>
        )}

        {!item.hasLicensedSource && (
          <div id="where-to-watch" className="mb-8">
            <h2 className="text-[17px] font-semibold mb-3">Where to watch</h2>
            <div className="flex flex-wrap gap-2">
              {[...(item.watchProviders?.KE?.flatrate || []), ...(item.watchProviders?.US?.flatrate || [])].map((p) => (
                <span key={p.name} className="text-xs px-3 py-1.5 rounded-full border border-line text-inkdim">{p.name}</span>
              ))}
              {!(item.watchProviders?.KE?.flatrate?.length || item.watchProviders?.US?.flatrate?.length) && (
                <span className="text-xs text-inkdim">No streaming providers listed yet.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {item.similar?.length > 0 && <Row title="More like this" items={item.similar} />}

      {trailerKey && <TrailerModal videoKey={trailerKey} onClose={() => setTrailerKey(null)} />}
    </div>
  );
}
