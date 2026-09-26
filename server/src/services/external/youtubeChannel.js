import { normalizeExternal } from '../externalNormalize.js';

const API = 'https://www.googleapis.com/youtube/v3';
const MIN_DURATION_SECONDS = 3600; // 60 min+, stricter than YouTube's own "long" (20min) bucket

export const hasYoutubeKey = () => Boolean(process.env.YOUTUBE_API_KEY);

const uploadsPlaylistCache = new Map();

async function getUploadsPlaylistId(channelId) {
  if (uploadsPlaylistCache.has(channelId)) return uploadsPlaylistCache.get(channelId);
  const url = new URL(`${API}/channels`);
  url.searchParams.set('part', 'contentDetails');
  url.searchParams.set('id', channelId);
  url.searchParams.set('key', process.env.YOUTUBE_API_KEY);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`youtube channels.list ${res.status}`);
  const data = await res.json();
  const playlistId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) throw new Error('no uploads playlist found for channel');
  uploadsPlaylistCache.set(channelId, playlistId);
  return playlistId;
}

function parseIsoDurationToSeconds(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  if (!m) return 0;
  const [, h, min, s] = m;
  return (Number(h) || 0) * 3600 + (Number(min) || 0) * 60 + (Number(s) || 0);
}

export async function search({ channelId, rows = 24 } = {}) {
  if (!hasYoutubeKey() || !channelId) return [];

  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);

  const plUrl = new URL(`${API}/playlistItems`);
  plUrl.searchParams.set('part', 'snippet');
  plUrl.searchParams.set('playlistId', uploadsPlaylistId);
  plUrl.searchParams.set('maxResults', Math.min(rows * 2, 50)); // over-fetch, some will be filtered by duration
  plUrl.searchParams.set('key', process.env.YOUTUBE_API_KEY);
  const plRes = await fetch(plUrl);
  if (!plRes.ok) throw new Error(`youtube playlistItems.list ${plRes.status}`);
  const plData = await plRes.json();
  const candidates = (plData.items || []).map((it) => ({
    videoId: it.snippet?.resourceId?.videoId,
    title: it.snippet?.title,
    overview: it.snippet?.description,
    posterPath: it.snippet?.thumbnails?.high?.url || it.snippet?.thumbnails?.default?.url || null,
    year: it.snippet?.publishedAt ? it.snippet.publishedAt.slice(0, 4) : null,
  })).filter((c) => c.videoId);
  if (!candidates.length) return [];

  const videosUrl = new URL(`${API}/videos`);
  videosUrl.searchParams.set('part', 'contentDetails');
  videosUrl.searchParams.set('id', candidates.map((c) => c.videoId).join(','));
  videosUrl.searchParams.set('key', process.env.YOUTUBE_API_KEY);
  const videosRes = await fetch(videosUrl);
  if (!videosRes.ok) throw new Error(`youtube videos.list ${videosRes.status}`);
  const videosData = await videosRes.json();
  const durationById = new Map(
    (videosData.items || []).map((v) => [v.id, parseIsoDurationToSeconds(v.contentDetails?.duration)])
  );

  return candidates
    .filter((c) => (durationById.get(c.videoId) || 0) >= MIN_DURATION_SECONDS)
    .slice(0, rows)
    .map((c) =>
      normalizeExternal({
        source: 'youtube_channel',
        refId: c.videoId,
        title: c.title,
        overview: c.overview,
        posterPath: c.posterPath,
        year: c.year,
        license: 'youtube_channel',
      })
    );
}

export async function resolvePlayback(videoId) {
  // reuse the player's existing iframe path rather than the raw YT.Player API,
  // which isn't wired up in the main watch player
  return { type: 'iframe', url: `https://www.youtube.com/embed/${videoId}?autoplay=1` };
}
