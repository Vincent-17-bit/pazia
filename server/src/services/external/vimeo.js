import { normalizeExternal } from '../externalNormalize.js';

const API = 'https://api.vimeo.com';

export const hasVimeoKey = () => Boolean(process.env.VIMEO_ACCESS_TOKEN);

export async function search({ query = 'documentary', rows = 20 } = {}) {
  if (!hasVimeoKey()) return [];
  const url = new URL(`${API}/videos`);
  url.searchParams.set('query', query);
  url.searchParams.set('filter', 'CC');
  url.searchParams.set('per_page', rows);

  const res = await fetch(url, { headers: { Authorization: `Bearer ${process.env.VIMEO_ACCESS_TOKEN}` } });
  if (!res.ok) throw new Error(`vimeo ${res.status}`);
  const data = await res.json();
  return (data.data || []).map((v) =>
    normalizeExternal({
      source: 'vimeo',
      refId: v.uri?.split('/').pop(),
      title: v.name,
      overview: v.description,
      posterPath: v.pictures?.sizes?.slice(-1)[0]?.link || null,
      year: v.release_time ? v.release_time.slice(0, 4) : null,
      playback: { type: 'iframe', url: v.player_embed_url },
      license: 'creative_commons',
    })
  );
}

export async function resolvePlayback(videoId) {
  return { type: 'iframe', url: `https://player.vimeo.com/video/${videoId}` };
}
