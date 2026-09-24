import { Link, useLocation } from 'react-router-dom';
import { grad } from './PosterCard.jsx';
import TitleStrip from './TitleStrip.jsx';
import MyListButton from './MyListButton.jsx';

export default function Hero({ featured, strip, onStripSelect, kicker }) {
  const location = useLocation();
  if (!featured) {
    return <div className="h-[64vh] min-h-[420px] bg-surface animate-pulse" />;
  }
  const bg = featured.backdropPath ? `url(${featured.backdropPath})` : grad(featured.colorSeed ?? 0);

  return (
    <section className="relative h-[64vh] min-h-[420px] overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center transition-opacity duration-400" style={{ backgroundImage: bg }} />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(11,11,15,0.95) 0%, rgba(11,11,15,0.55) 45%, rgba(11,11,15,0.15) 75%), linear-gradient(0deg, var(--bg) 0%, rgba(11,11,15,0.1) 40%)',
        }}
      />
      <div className="relative z-10 h-full flex flex-col justify-end px-5 pb-4.5 max-w-[640px]">
        {kicker && (
          <div className="text-[13px] font-semibold tracking-wide text-red uppercase mb-1.5">{kicker}</div>
        )}
        <h1 className="text-[clamp(28px,6vw,44px)] font-bold mb-2">{featured.title}</h1>
        <div className="flex gap-2 items-center text-[13px] text-inkdim mb-2.5">
          <span>{featured.year}</span>
          <span className="w-[3px] h-[3px] rounded-full bg-inkdim" />
          <span>★ {featured.rating}</span>
          <span className="w-[3px] h-[3px] rounded-full bg-inkdim" />
          <span>{featured.genres?.[0]}</span>
        </div>
        <p className="text-sm leading-relaxed text-[#d4d4d8] mb-4 line-clamp-3">{featured.overview}</p>
        <div className="flex gap-3 mb-5">
          <Link
            to={`/title/${featured.mediaType}/${featured.id}`}
            state={{ background: location }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-white text-bg"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            Play
          </Link>
          <MyListButton mediaType={featured.mediaType} tmdbId={featured.id} variant="pill" />
        </div>
        <TitleStrip items={strip} activeId={featured.id} onSelect={onStripSelect} />
      </div>
    </section>
  );
}
