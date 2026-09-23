import * as wikidata from './wikidata.js';
import * as wikipedia from './wikipedia.js';
import * as omdb from './omdb.js';
import * as tvmaze from './tvmaze.js';

function toCard(r) {
  return {
    id: `${r.source}:${r.refId}`,
    mediaType: 'info',
    realMediaType: r.mediaType || 'movie',
    title: r.title,
    overview: r.overview || '',
    posterPath: r.posterPath || null,
    backdropPath: r.posterPath || null,
    rating: null,
    year: r.year || null,
    genreIds: [],
    external: true,
    source: r.source,
  };
}

export async function fallbackDetail(source, refId) {
  if (source === 'omdb') {
    const url = new URL('https://www.omdbapi.com/');
    url.searchParams.set('apikey', process.env.OMDB_API_KEY || '');
    url.searchParams.set('i', refId);
    const data = await (await fetch(url)).json();
    if (data.Response === 'False') return null;
    return {
      title: data.Title,
      overview: data.Plot,
      posterPath: data.Poster !== 'N/A' ? data.Poster : null,
      year: data.Year,
      ratings: { imdbRating: data.imdbRating, rottenTomatoes: data.Ratings?.find((r) => r.Source === 'Rotten Tomatoes')?.Value },
    };
  }
  if (source === 'tvmaze') {
    const data = await (await fetch(`https://api.tvmaze.com/shows/${refId}`)).json();
    if (!data?.name) return null;
    return { title: data.name, overview: (data.summary || '').replace(/<[^>]+>/g, ''), posterPath: data.image?.original || null, year: data.premiered?.slice(0, 4) };
  }
  if (source === 'wikipedia') {
    const url = new URL('https://en.wikipedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('pageids', refId);
    url.searchParams.set('prop', 'extracts|pageimages');
    url.searchParams.set('piprop', 'original');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');
    const data = await (await fetch(url)).json();
    const page = Object.values(data.query?.pages || {})[0];
    if (!page) return null;
    return { title: page.title, overview: (page.extract || '').replace(/<[^>]+>/g, ''), posterPath: page.original?.source || null };
  }
  if (source === 'wikidata') {
    const url = new URL('https://www.wikidata.org/w/api.php');
    url.searchParams.set('action', 'wbgetentities');
    url.searchParams.set('ids', refId);
    url.searchParams.set('props', 'labels|descriptions');
    url.searchParams.set('languages', 'en');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');
    const data = await (await fetch(url)).json();
    const entity = data.entities?.[refId];
    if (!entity) return null;
    return { title: entity.labels?.en?.value, overview: entity.descriptions?.en?.value || '' };
  }
  return null;
}

// used when TMDB has no/thin results for a query - not a replacement, a supplement
export async function fallbackSearch(query) {
  const results = await Promise.allSettled([
    wikidata.search(query),
    wikipedia.search(query),
    omdb.search(query),
    tvmaze.search(query),
  ]);
  const merged = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  const seen = new Set();
  return merged
    .filter((r) => {
      const k = r.title?.toLowerCase();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map(toCard);
}
