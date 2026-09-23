import { normalizeExternal } from '../externalNormalize.js';

const API = 'https://commons.wikimedia.org/w/api.php';

export async function search({ query = 'short film', rows = 20 } = {}) {
  const url = new URL(API);
  url.searchParams.set('action', 'query');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrsearch', `filetype:video ${query}`);
  url.searchParams.set('gsrnamespace', '6');
  url.searchParams.set('gsrlimit', rows);
  url.searchParams.set('prop', 'videoinfo|imageinfo');
  url.searchParams.set('viprop', 'url|mime');
  url.searchParams.set('iiprop', 'url');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');

  const res = await fetch(url);
  if (!res.ok) throw new Error(`commons ${res.status}`);
  const data = await res.json();
  const pages = Object.values(data.query?.pages || {});
  return pages
    .filter((p) => p.videoinfo?.[0]?.url)
    .map((p) =>
      normalizeExternal({
        source: 'wikimedia',
        refId: p.pageid,
        title: (p.title || '').replace(/^File:/, '').replace(/\.\w+$/, ''),
        overview: '',
        posterPath: null,
        playback: { type: p.videoinfo[0].mime?.includes('webm') ? 'webm' : 'mp4', url: p.videoinfo[0].url },
      })
    );
}

export async function resolvePlayback() {
  return null; // playback url is already embedded at search time
}
