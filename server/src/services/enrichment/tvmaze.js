const API = 'https://api.tvmaze.com';

export async function search(query) {
  const res = await fetch(`${API}/search/shows?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`tvmaze ${res.status}`);
  const data = await res.json();
  return (data || []).slice(0, 5).map(({ show: s }) => ({
    source: 'tvmaze',
    refId: s.id,
    title: s.name,
    overview: (s.summary || '').replace(/<[^>]+>/g, ''),
    posterPath: s.image?.medium || null,
    year: s.premiered ? s.premiered.slice(0, 4) : null,
    mediaType: 'tv',
  }));
}
