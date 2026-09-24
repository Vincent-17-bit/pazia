import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { track } from '../lib/analytics.js';
import { grad } from './PosterCard.jsx';
import TitleHeroMedia from './TitleHeroMedia.jsx';
import EpisodeList from './EpisodeList.jsx';
import Row from './Row.jsx';
import { useMyList } from '../context/MyListContext.jsx';
import { useRatings } from '../context/RatingsContext.jsx';

function DownloadMenu({ item, onClose }) {
  const qualities = item.downloadQualities?.length
    ? item.downloadQualities
    : [{ label: '480p', sizeMB: null }, { label: '720p', sizeMB: null }, { label: '1080p', sizeMB: null }];
  const [progress, setProgress] = useState({});

  async function startDownload(q) {
    if (!q.url || progress[q.label]?.status === 'downloading') return;
    setProgress((p) => ({ ...p, [q.label]: { status: 'downloading', pct: 0 } }));
    try {
      const res = await fetch(q.url);
      const total = Number(res.headers.get('content-length')) || 0;
      const reader = res.body.getReader();
      const chunks = [];
      let loaded = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;
        setProgress((p) => ({ ...p, [q.label]: { status: 'downloading', pct: total ? Math.round((loaded / total) * 100) : p[q.label]?.pct || 0 } }));
      }
      const blobUrl = URL.createObjectURL(new Blob(chunks));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${item.title || 'video'} - ${q.label}`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      setProgress((p) => ({ ...p, [q.label]: { status: 'done', pct: 100 } }));
    } catch {
      setProgress((p) => ({ ...p, [q.label]: { status: 'error', pct: 0 } }));
    }
  }

  return (
    <div className="absolute z-20 top-full mt-2 left-0 bg-surface border border-line rounded-lg overflow-hidden min-w-[180px] shadow-xl">
      {qualities.map((q) => {
        const st = progress[q.label];
        return (
          <button
            key={q.label}
            onClick={() => (st?.status === 'downloading' ? undefined : st?.status === 'done' ? onClose() : startDownload(q))}
            disabled={!q.url}
            className="relative w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-surface2 disabled:opacity-40 overflow-hidden text-left"
          >
            {st?.status === 'downloading' && (
              <span className="absolute inset-y-0 left-0 bg-red/20" style={{ width: `${st.pct}%` }} />
            )}
            <span className="relative z-10">{q.label}</span>
            <span className="relative z-10 text-xs text-inkdim">
              {st?.status === 'downloading' && `${st.pct}%`}
              {st?.status === 'done' && 'Done'}
              {st?.status === 'error' && 'Failed'}
              {!st && q.sizeMB && `${q.sizeMB} MB`}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CertificationBadge({ rating, reason }) {
  const [open, setOpen] = useState(false);
  if (!reason) {
    return <span className="text-[11px] border border-line rounded px-1.5">{rating}</span>;
  }
  return (
    <span className="relative group inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        className="text-[11px] border border-line rounded px-1.5 text-ink"
      >
        {rating}
      </button>
      <span
        role="tooltip"
        className={`absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-surface border border-line rounded-md px-2.5 py-1.5 text-[11px] text-inkdim ${
          open ? 'block' : 'hidden md:group-hover:block'
        }`}
      >
        {reason}
      </span>
    </span>
  );
}

export default function TitleContent({ mediaType, id, variant = 'page', onClose, onNavigateTitle }) {
  const navigate = useNavigate();
  const { has, toggle } = useMyList();
  const { get: getRating, rate } = useRatings();
  const [season, setSeason] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const query = useQuery({
    queryKey: ['title', mediaType, id],
    queryFn: () => api.title(mediaType, id),
  });

  const progressQuery = useQuery({
    queryKey: ['continue-watching'],
    queryFn: () => api.continueWatching(),
    enabled: mediaType === 'tv' && !!query.data,
  });

  useEffect(() => {
    setSeason(null);
    setExpanded(false);
    setShowMore(false);
  }, [mediaType, id]);

  useEffect(() => {
    if (variant === 'modal' && query.data) {
      track('modal_viewed', { mediaType: query.data.mediaType, tmdbId: query.data.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, query.data?.id]);

  useEffect(() => {
    if (query.data?.seasons?.length && season === null) {
      setSeason(query.data.seasons[query.data.seasons.length - 1].seasonNumber);
    }
  }, [query.data, season]);

  if (query.isLoading) {
    return (
      <div className={variant === 'modal' ? 'h-[60vh] animate-pulse bg-surface' : 'pt-[calc(120px+env(safe-area-inset-top,0px))] px-5'}>
        {variant === 'page' && <div className="h-40 bg-surface animate-pulse rounded-lg" />}
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <div className="p-8 text-center">
        <p className="text-inkdim text-sm mb-4">This title isn't available right now.</p>
        {onClose && <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white/10 text-sm">Close</button>}
      </div>
    );
  }

  const item = query.data;
  const inList = has(item.mediaType, item.id);
  const rating = getRating(item.mediaType, item.id);
  const heroHeight = variant === 'modal' ? 'h-[60vh] md:h-[60vh] max-md:h-[40vh]' : 'h-[42vh] min-h-[280px]';

  function goPlay(seasonNumber, episodeNumber) {
    if (mediaType === 'movie') {
      navigate(`/watch/movie/${item.id}`);
      return;
    }
    if (seasonNumber != null && episodeNumber != null) {
      navigate(`/watch/tv/${item.id}?season=${seasonNumber}&episode=${episodeNumber}`);
      return;
    }
    const resume = progressQuery.data?.items?.find((r) => r.mediaType === 'tv' && String(r.id) === String(item.id));
    if (resume?.season != null && resume?.episode != null) {
      navigate(`/watch/tv/${item.id}?season=${resume.season}&episode=${resume.episode}`);
    } else if (item.nextEpisode) {
      navigate(`/watch/tv/${item.id}?season=${item.nextEpisode.seasonNumber}&episode=${item.nextEpisode.episodeNumber}`);
    } else {
      navigate(`/watch/tv/${item.id}?season=1&episode=1`);
    }
  }

  function onPlay() {
    track('play_clicked', { mediaType: item.mediaType, tmdbId: item.id });
    if (item.hasLicensedSource) {
      goPlay();
    } else {
      setExpanded(true);
      requestAnimationFrame(() => document.getElementById('where-to-watch')?.scrollIntoView({ behavior: 'smooth' }));
    }
  }

  async function onShare() {
    const url = `${window.location.origin}/title/${item.mediaType}/${item.id}`;
    if (navigator.share) {
      navigator.share({ title: item.title, url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
    }
  }

  function onSelectSimilar(nextItem) {
    if (onNavigateTitle) onNavigateTitle(nextItem.mediaType, nextItem.id);
    else navigate(`/title/${nextItem.mediaType}/${nextItem.id}`);
  }

  return (
    <div className={variant === 'modal' ? '' : 'pb-16'}>
      <TitleHeroMedia
        backdropPath={item.backdropPath}
        colorSeed={item.colorSeed}
        trailerKey={item.trailers?.[0]?.key}
        heightClass={heroHeight}
        onClose={onClose}
      />

      <div className={`px-5 relative z-10 ${variant === 'modal' ? '-mt-6' : '-mt-10'}`}>
        <h1 className="text-2xl font-bold mb-1.5">{item.title}</h1>
        <div className="flex gap-2 items-center text-[13px] text-inkdim mb-3 flex-wrap">
          <span>★ {item.rating}</span><span>·</span><span>{item.year}</span>
          {item.runtime && <><span>·</span><span>{item.runtime}m</span></>}
          {item.mediaType === 'tv' && item.seasons?.length && <><span>·</span><span>{item.seasons.length} season{item.seasons.length > 1 ? 's' : ''}</span></>}
          {item.certification && <CertificationBadge rating={item.certification} reason={item.certificationReason} />}
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {item.genres?.map((g) => (
            <span key={g} className="text-xs px-3 py-1 rounded-full border border-line text-inkdim">{g}</span>
          ))}
        </div>

        <p className="text-sm text-[#d4d4d8] leading-relaxed mb-5">
          <span className={showMore ? '' : 'line-clamp-3'}>{item.overview}</span>
          {item.overview?.length > 140 && (
            <button onClick={() => setShowMore((s) => !s)} className="block text-xs text-ink font-semibold mt-1">
              {showMore ? 'less' : 'more'}
            </button>
          )}
        </p>

        <div className="flex gap-3 mb-8 flex-wrap overflow-x-auto no-scrollbar relative">
          <button onClick={onPlay} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-bg flex-none">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            Play
          </button>

          {item.downloadable && (
            <div className="relative flex-none">
              <button
                onClick={() => setDownloadOpen((o) => !o)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white/10 border border-white/25"
              >
                ⬇ Download
              </button>
              {downloadOpen && <DownloadMenu item={item} onClose={() => setDownloadOpen(false)} />}
            </div>
          )}

          <button
            onClick={() => toggle(item.mediaType, item.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border flex-none ${inList ? 'bg-red border-red' : 'bg-white/10 border-white/25'}`}
          >
            {inList ? '✓ Added' : '+ My List'}
          </button>

          <div className="flex items-center gap-1.5 flex-none">
            <button
              onClick={() => rate(item.mediaType, item.id, 'up')}
              aria-label="Thumbs up"
              aria-pressed={rating === 'up'}
              className={`w-10 h-10 rounded-full border flex items-center justify-center text-base ${rating === 'up' ? 'bg-red border-red' : 'bg-white/10 border-white/25'}`}
            >
              👍
            </button>
            <button
              onClick={() => rate(item.mediaType, item.id, 'down')}
              aria-label="Thumbs down"
              aria-pressed={rating === 'down'}
              className={`w-10 h-10 rounded-full border flex items-center justify-center text-base ${rating === 'down' ? 'bg-red border-red' : 'bg-white/10 border-white/25'}`}
            >
              👎
            </button>
            <button
              onClick={() => rate(item.mediaType, item.id, 'love')}
              aria-label="Loved it"
              aria-pressed={rating === 'love'}
              className={`w-10 h-10 rounded-full border flex items-center justify-center text-base ${rating === 'love' ? 'bg-red border-red' : 'bg-white/10 border-white/25'}`}
            >
              ❤️
            </button>
          </div>

          <button onClick={onShare} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white/10 border border-white/25 flex-none">
            🔗 Share
          </button>
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-between py-3 border-t border-line text-sm font-semibold mb-4"
        >
          More Details
          <span className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>⌄</span>
        </button>

        {expanded && (
          <div className="mb-8 space-y-8">
            {item.crew?.length > 0 && (
              <div className="text-sm text-inkdim">
                {item.crew.map((c) => `${c.job}: ${c.name}`).join(' · ')}
              </div>
            )}

            {item.cast?.length > 0 && (
              <div>
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

            <div className="text-xs text-inkdim space-y-1">
              {item.originalLanguage && <div>Original language: {item.originalLanguage}</div>}
              {item.productionCountries?.length > 0 && <div>Production: {item.productionCountries.join(', ')}</div>}
              {(item.budget || item.revenue) && (
                <div>{item.budget ? `Budget: $${item.budget.toLocaleString()}` : ''} {item.revenue ? ` · Revenue: $${item.revenue.toLocaleString()}` : ''}</div>
              )}
            </div>

            {item.mediaType === 'tv' && item.seasons?.length > 0 && (
              <div>
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
                {season !== null && (
                  <EpisodeList
                    mediaType={item.mediaType}
                    id={item.id}
                    seasonNumber={season}
                    onPlayEpisode={(s, e) => goPlay(s, e)}
                  />
                )}
              </div>
            )}

            {!item.hasLicensedSource && (
              <div id="where-to-watch">
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
        )}
      </div>

      {item.similar?.length > 0 && (
        <Row title="More Like This" items={item.similar} onItemClick={onSelectSimilar} />
      )}
    </div>
  );
}
