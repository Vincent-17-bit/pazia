import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import PosterCard from '../components/PosterCard.jsx';

const GENRES = ['Action', 'Comedy', 'Drama', 'Romance', 'Crime', 'Documentary', 'Plays & Theatre'];
const LANGUAGES = [
  ['sw', 'Swahili'], ['en', 'English'], ['hi', 'Hindi'], ['yo', 'Yoruba'],
  ['ig', 'Igbo'], ['ha', 'Hausa'], ['ko', 'Korean'], ['fr', 'French'],
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [page, setPage] = useState(1);

  const type = params.get('type') || '';
  const genre = params.get('genre') || '';
  const language = params.get('language') || '';
  const year = params.get('year') || '';
  const minRating = params.get('minRating') || '';

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
    setPage(1);
  }

  const query = useQuery({
    queryKey: ['search', q, type, genre, language, year, minRating, page],
    queryFn: () =>
      api.search({
        q,
        type,
        genre,
        language,
        year,
        minRating,
        page: String(page),
      }),
    enabled: Boolean(q || type || genre || language || year || minRating),
  });

  return (
    <div className="px-5 pt-[calc(120px+env(safe-area-inset-top,0px))] pb-16">
      <div className="flex items-center gap-2.5 bg-surface border border-line rounded-[10px] px-3.5 py-2.5 mb-4">
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] stroke-inkdim fill-none stroke-2 flex-none">
          <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.6" y2="16.6" />
        </svg>
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); updateParam('q', e.target.value); }}
          placeholder="Search titles, people, genres…"
          className="flex-1 bg-transparent outline-none text-[15px]"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {['movie', 'tv'].map((t) => (
          <button
            key={t}
            onClick={() => updateParam('type', type === t ? '' : t)}
            className={`px-3.5 py-1.5 rounded-full text-xs border ${type === t ? 'bg-red border-red' : 'border-line text-inkdim'}`}
          >
            {t === 'movie' ? 'Movies' : 'TV'}
          </button>
        ))}
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => updateParam('genre', genre === g ? '' : g)}
            className={`px-3.5 py-1.5 rounded-full text-xs border ${genre === g ? 'bg-red border-red' : 'border-line text-inkdim'}`}
          >
            {g}
          </button>
        ))}
        <select
          value={language}
          onChange={(e) => updateParam('language', e.target.value)}
          className="px-3 py-1.5 rounded-full text-xs border border-line bg-surface text-inkdim"
        >
          <option value="">Any language</option>
          {LANGUAGES.map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
        <input
          value={year}
          onChange={(e) => updateParam('year', e.target.value)}
          placeholder="Year"
          className="w-20 px-3 py-1.5 rounded-full text-xs border border-line bg-surface text-inkdim"
        />
        <input
          value={minRating}
          onChange={(e) => updateParam('minRating', e.target.value)}
          placeholder="Min rating"
          className="w-24 px-3 py-1.5 rounded-full text-xs border border-line bg-surface text-inkdim"
        />
      </div>

      {query.isLoading && <div className="text-sm text-inkdim">Searching…</div>}
      {query.isError && <div className="text-sm text-inkdim">Something went wrong. Try a different search.</div>}
      {query.data && query.data.items.length === 0 && (
        <div className="text-sm text-inkdim">No results. Try removing a filter or checking spelling.</div>
      )}
      {!query.data && !query.isLoading && (
        <div className="text-sm text-inkdim">Type a title or pick a filter to start searching.</div>
      )}

      <div className="flex flex-wrap gap-3.5">
        {query.data?.items.map((item) => (
          <PosterCard key={`${item.mediaType}-${item.id}`} item={item} />
        ))}
      </div>

      {query.data?.items.length >= 20 && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="mt-6 mx-auto block px-5 py-2.5 rounded-lg text-sm border border-line text-inkdim"
        >
          Load more
        </button>
      )}
    </div>
  );
}
