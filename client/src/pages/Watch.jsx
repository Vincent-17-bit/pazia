import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import Player from '../player/Player.jsx';

export default function Watch() {
  const { mediaType, id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const season = params.get('season') ? Number(params.get('season')) : null;
  const episode = params.get('episode') ? Number(params.get('episode')) : null;

  function goBack() {
    if (location.key !== 'default') navigate(-1);
    else navigate(`/title/${mediaType}/${id}`, { replace: true });
  }

  const [showNext, setShowNext] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [ended, setEnded] = useState(false);

  const sourceQuery = useQuery({
    queryKey: ['source', mediaType, id, season, episode],
    queryFn: () => api.source(mediaType, id, season, episode),
    retry: false,
  });

  const progressQuery = useQuery({
    queryKey: ['progress', mediaType, id, season, episode],
    queryFn: () => api.getProgress(mediaType, id, season, episode),
  });

  const titleQuery = useQuery({
    queryKey: ['title', mediaType, id],
    queryFn: () => api.title(mediaType, id),
  });

  const saveProgress = useCallback(
    (position, duration) => {
      api.putProgress({ mediaType, tmdbId: id, season, episode, position, duration }).catch(() => {});
    },
    [mediaType, id, season, episode]
  );

  function onEnded() {
    setEnded(true);
    if (mediaType === 'tv') setShowNext(true);
  }

  useEffect(() => {
    if (!showNext) return;
    if (countdown <= 0) {
      goToNext();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showNext, countdown]);

  function goToNext() {
    const seasons = titleQuery.data?.seasons || [];
    const current = seasons.find((s) => s.seasonNumber === season);
    let nextSeason = season;
    let nextEpisode = episode + 1;
    if (current && nextEpisode > current.episodeCount) {
      nextSeason = season + 1;
      nextEpisode = 1;
    }
    navigate(`/watch/${mediaType}/${id}?season=${nextSeason}&episode=${nextEpisode}`, { replace: true });
    setShowNext(false);
    setCountdown(8);
    setEnded(false);
  }

  if (sourceQuery.isLoading || progressQuery.isLoading) {
    return <div className="fixed inset-0 bg-black flex items-center justify-center text-white text-sm">Loading…</div>;
  }

  if (sourceQuery.isError || !sourceQuery.data) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center text-center px-6 gap-4">
        <button onClick={goBack} className="absolute top-[calc(16px+env(safe-area-inset-top,0px))] left-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 stroke-white fill-none stroke-2"><path d="M15 19l-7-7 7-7" /></svg>
        </button>
        <p className="text-white text-sm max-w-xs">
          {sourceQuery.error?.body?.hint || 'No playback source available for this title yet.'}
        </p>
        <Link to={`/title/${mediaType}/${id}`} className="text-red text-sm underline">See where to watch</Link>
      </div>
    );
  }

  const startAt = progressQuery.data ? Math.max(0, progressQuery.data.position - 2) : 0;
  const title = titleQuery.data?.title;
  const subtitle = season ? `S${season} · E${episode}` : null;

  return (
    <>
      <Player
        key={`${mediaType}-${id}-${season}-${episode}`}
        source={sourceQuery.data}
        startAt={startAt}
        onProgress={saveProgress}
        onEnded={onEnded}
        onBack={goBack}
        title={title}
        subtitle={subtitle}
      />
      {showNext && (
        <div className="fixed bottom-24 right-6 z-[210] bg-surface border border-line rounded-xl p-4 w-64">
          <div className="text-sm font-semibold mb-1">Next Episode in {countdown}s</div>
          <div className="flex gap-2 mt-3">
            <button onClick={goToNext} className="flex-1 bg-red rounded-md py-2 text-sm font-semibold">Play now</button>
            <button onClick={() => setShowNext(false)} className="flex-1 border border-line rounded-md py-2 text-sm">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
