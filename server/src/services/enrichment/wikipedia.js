const API = 'https://en.wikipedia.org/w/api.php';

export async function search(query) {
  const url = new URL(API);
  url.searchParams.set('action', 'query');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrsearch', query);
  url.searchParams.set('gsrlimit', '5');
  url.searchParams.set('prop', 'extracts|pageimages');
  url.searchParams.set('exintro', '1');
  url.searchParams.set('exchars', '200');
  url.searchParams.set('piprop', 'thumbnail');
  url.searchParams.set('pithumbsize', '300');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`wikipedia ${res.status}`);
  const data = await res.json();
  const pages = Object.values(data.query?.pages || {});
  return pages.map((p) => ({
    source: 'wikipedia',
    refId: p.pageid,
    title: p.title,
    overview: (p.extract || '').replace(/<[^>]+>/g, ''),
    posterPath: p.thumbnail?.source || null,
  }));
}
