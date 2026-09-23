const API = 'https://www.wikidata.org/w/api.php';

export async function search(query) {
  const url = new URL(API);
  url.searchParams.set('action', 'wbsearchentities');
  url.searchParams.set('search', query);
  url.searchParams.set('language', 'en');
  url.searchParams.set('type', 'item');
  url.searchParams.set('limit', '5');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`wikidata ${res.status}`);
  const data = await res.json();
  return (data.search || []).map((r) => ({
    source: 'wikidata',
    refId: r.id,
    title: r.label,
    overview: r.description || '',
    posterPath: null,
  }));
}
