const API = 'https://www.omdbapi.com/';

export const hasOmdbKey = () => Boolean(process.env.OMDB_API_KEY);

export async function search(query) {
  if (!hasOmdbKey()) return [];
  const url = new URL(API);
  url.searchParams.set('apikey', process.env.OMDB_API_KEY);
  url.searchParams.set('s', query);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`omdb ${res.status}`);
  const data = await res.json();
  if (data.Response === 'False') return [];
  return (data.Search || []).map((r) => ({
    source: 'omdb',
    refId: r.imdbID,
    title: r.Title,
    overview: '',
    posterPath: r.Poster !== 'N/A' ? r.Poster : null,
    year: r.Year,
    mediaType: r.Type === 'series' ? 'tv' : 'movie',
  }));
}

export async function ratingsByImdbId(imdbId) {
  if (!hasOmdbKey() || !imdbId) return null;
  const url = new URL(API);
  url.searchParams.set('apikey', process.env.OMDB_API_KEY);
  url.searchParams.set('i', imdbId);

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.Response === 'False') return null;
  return {
    imdbRating: data.imdbRating !== 'N/A' ? data.imdbRating : null,
    rottenTomatoes: data.Ratings?.find((r) => r.Source === 'Rotten Tomatoes')?.Value || null,
    metascore: data.Metascore !== 'N/A' ? data.Metascore : null,
  };
}
