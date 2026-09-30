import IngestChannel from '../../models/IngestChannel.js';
import ExternalTitle from '../../models/ExternalTitle.js';
import IngestRejection from '../../models/IngestRejection.js';
import IngestBlock from '../../models/IngestBlock.js';
import { matchTmdb } from './tmdbMatch.js';
import { classifyRows } from './rowClassify.js';
import { parseEpisodeInfo, seriesKeyFor } from './common.js';
import { loadQuotaState, saveQuotaState, hasBudget, DEFAULT_DAILY_LIMIT } from './youtubeQuota.js';
import { SEED_CHANNELS } from './seedData.js';

const API = 'https://www.googleapis.com/youtube/v3';
const MIN_DURATION_SECONDS = 40 * 60;
const MIN_EPISODE_SECONDS = 3 * 60;
const KIDS_ROWS = new Set(['toon_town', 'kids_corner', 'bedtime_stories']);

export const hasYoutubeKey = () => Boolean(process.env.YOUTUBE_API_KEY);

function key() {
  return process.env.YOUTUBE_API_KEY;
}

export async function ensureSeedChannels() {
  const count = await IngestChannel.countDocuments();
  if (count > 0) return;
  await IngestChannel.insertMany(SEED_CHANNELS.map((c) => ({ ...c, active: true })));
}

function parseIsoDurationToSeconds(iso) {
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '');
  if (!m) return 0;
  const [, h, min, s] = m;
  return (Number(h) || 0) * 3600 + (Number(min) || 0) * 60 + (Number(s) || 0);
}

async function apiGet(path, params) {
  const url = new URL(`${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set('key', key());
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`youtube ${path} ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

async function resolveChannelId(channel) {
  if (channel.channelId) return channel.channelId;
  if (!channel.handle) return null;
  const handle = channel.handle.replace(/^@/, '');
  const data = await apiGet('channels', { part: 'id', forHandle: handle });
  const id = data.items?.[0]?.id;
  if (id) {
    channel.channelId = id; // keep the in-memory row in sync so this loop doesn't re-resolve it every pass
    await IngestChannel.updateOne({ _id: channel._id }, { channelId: id, verified: true });
  }
  return id || null;
}

async function getUploadsPlaylistId(channelId) {
  const data = await apiGet('channels', { part: 'contentDetails', id: channelId });
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

async function logRejection(sourceId, title, reason, detail = null) {
  try {
    await IngestRejection.create({ source: 'youtube', sourceId, title, reason, detail });
  } catch {
    // best-effort
  }
}

async function processVideo(video, channel) {
  const id = video.id;
  const blocked = await IngestBlock.findOne({ source: 'youtube', sourceId: id }).lean();
  if (blocked) return { skipped: true };

  const status = video.status || {};
  if (status.privacyStatus !== 'public') {
    await logRejection(id, video.snippet?.title, 'not_public');
    return { rejected: true };
  }
  if (status.embeddable === false) {
    await logRejection(id, video.snippet?.title, 'not_embeddable');
    return { rejected: true };
  }

  const title = video.snippet?.title || 'Untitled';
  const durationSec = parseIsoDurationToSeconds(video.contentDetails?.duration);
  const epInfo = parseEpisodeInfo(title);

  if (epInfo.isEpisode) {
    if (durationSec < MIN_EPISODE_SECONDS) {
      await logRejection(id, title, 'too_short', `${Math.round(durationSec / 60)} min episode`);
      return { rejected: true };
    }
  } else if (durationSec < MIN_DURATION_SECONDS) {
    await logRejection(id, title, 'too_short', `${Math.round(durationSec / 60)} min`);
    return { rejected: true };
  }

  const madeForKids = Boolean(status.madeForKids ?? video.status?.selfDeclaredMadeForKids);
  const year = video.snippet?.publishedAt ? video.snippet.publishedAt.slice(0, 4) : null;
  const runtimeMinutes = Math.max(1, Math.round(durationSec / 60));

  let tmdb = null;
  try {
    tmdb = await matchTmdb(epInfo.isEpisode ? epInfo.seriesTitle : title, year, epInfo.isEpisode ? 'tv' : 'movie');
  } catch {
    tmdb = null;
  }

  let { rows, genre } = classifyRows({
    channelCategories: channel.categories || [],
    tmdbGenreIds: tmdb?.genreIds || [],
    tmdbMediaType: tmdb?.tmdbMediaType,
    runtimeMinutes,
    isEpisode: epInfo.isEpisode,
  });
  // kid-flagged content only ever surfaces in kids/family rows, regardless
  // of what genre classification would otherwise have added
  if (madeForKids) rows = rows.filter((r) => KIDS_ROWS.has(r));
  if (channel.isKids && !rows.length) rows = ['kids_corner'];

  const thumb = video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url || null;

  const docPayload = {
    source: 'youtube',
    sourceId: id,
    mediaType: epInfo.isEpisode ? 'tv' : 'movie',
    seriesKey: epInfo.isEpisode ? seriesKeyFor(channel.channelId, epInfo.seriesTitle) : null,
    season: epInfo.isEpisode ? epInfo.season : null,
    episode: epInfo.isEpisode ? epInfo.episode : null,
    title: epInfo.isEpisode ? epInfo.seriesTitle : title,
    description: video.snippet?.description || '',
    runtimeMinutes,
    genre,
    year,
    language: video.snippet?.defaultAudioLanguage || video.snippet?.defaultLanguage || null,
    posterPath: tmdb?.posterPath || thumb,
    backdropPath: tmdb?.backdropPath || thumb,
    playback: { type: 'youtube_embed', videoId: id },
    license: 'official_channel',
    rows,
    tmdbId: tmdb?.tmdbId || null,
    tmdbMediaType: tmdb?.tmdbMediaType || null,
    tmdbAttribution: Boolean(tmdb),
    channelId: channel.channelId,
    embeddable: true,
    madeForKids,
    status: 'active',
    statusReason: null,
    lastRefreshedAt: new Date(),
  };

  await ExternalTitle.findOneAndUpdate(
    { source: 'youtube', sourceId: id, season: docPayload.season, episode: docPayload.episode },
    docPayload,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { saved: true };
}

// One bounded pass, quota-aware. Walks channels -> uploads playlist pages
// via playlistItems (never search.list, which burns the daily quota fast).
// Stops before the daily cap and resumes tomorrow from the saved cursor.
export async function runYoutubeTick({ budgetMs = 8000, maxItems = 40, dailyLimit = DEFAULT_DAILY_LIMIT } = {}) {
  if (!hasYoutubeKey()) return { processed: 0, saved: 0, rejected: 0, quotaExhausted: false, noKey: true };

  await ensureSeedChannels();
  const channels = await IngestChannel.find({ active: true }).sort({ _id: 1 }).lean();
  if (!channels.length) return { processed: 0, saved: 0, rejected: 0, quotaExhausted: false };

  let { cursor, quotaUsed, quotaDate } = await loadQuotaState();
  let { channelIdx = 0, pageToken = null } = cursor;
  const startState = `${channelIdx}:${pageToken || ''}`;
  let lapped = false;

  const started = Date.now();
  let processed = 0, saved = 0, rejected = 0, quotaExhausted = false;

  while (Date.now() - started < budgetMs && processed < maxItems) {
    if (channelIdx >= channels.length) channelIdx = 0;
    // every channel's upload list has been walked with nothing new this
    // tick - stop rather than spend more quota re-fetching the same pages
    if (lapped && `${channelIdx}:${pageToken || ''}` === startState) break;
    lapped = true;
    const channel = channels[channelIdx];

    if (!hasBudget(quotaUsed, 1, dailyLimit)) { quotaExhausted = true; break; }
    let channelId;
    try {
      channelId = await resolveChannelId(channel);
      quotaUsed += 1;
    } catch (err) {
      await logRejection(channel.handle || channel.channelId || 'unknown', channel.label, 'channel_resolve_failed', err.message);
      channelIdx += 1;
      pageToken = null;
      continue;
    }
    if (!channelId) {
      channelIdx += 1;
      pageToken = null;
      continue;
    }

    let uploadsId = channel._uploadsId;
    if (!uploadsId) {
      if (!hasBudget(quotaUsed, 1, dailyLimit)) { quotaExhausted = true; break; }
      try {
        uploadsId = await getUploadsPlaylistId(channelId);
        channel._uploadsId = uploadsId; // cache in-memory for the rest of this tick's pagination
        quotaUsed += 1;
      } catch (err) {
        await logRejection(channelId, channel.label, 'uploads_lookup_failed', err.message);
        channelIdx += 1;
        pageToken = null;
        continue;
      }
    }
    if (!uploadsId) { channelIdx += 1; pageToken = null; continue; }

    if (!hasBudget(quotaUsed, 1, dailyLimit)) { quotaExhausted = true; break; }
    let plData;
    try {
      plData = await apiGet('playlistItems', {
        part: 'snippet', playlistId: uploadsId, maxResults: 50,
        ...(pageToken ? { pageToken } : {}),
      });
      quotaUsed += 1;
    } catch (err) {
      await logRejection(channelId, channel.label, 'playlist_fetch_failed', err.message);
      channelIdx += 1;
      pageToken = null;
      continue;
    }

    const videoIds = (plData.items || []).map((it) => it.snippet?.resourceId?.videoId).filter(Boolean);
    if (videoIds.length) {
      if (!hasBudget(quotaUsed, 1, dailyLimit)) { quotaExhausted = true; break; }
      let videosData;
      try {
        videosData = await apiGet('videos', { part: 'snippet,contentDetails,status', id: videoIds.join(',') });
        quotaUsed += 1;
      } catch (err) {
        await logRejection(channelId, channel.label, 'videos_fetch_failed', err.message);
        videosData = { items: [] };
      }

      for (const video of videosData.items || []) {
        if (processed >= maxItems || Date.now() - started >= budgetMs) break;
        processed += 1;
        try {
          const result = await processVideo(video, channel);
          if (result?.saved) saved += 1;
          if (result?.rejected) rejected += 1;
        } catch (err) {
          rejected += 1;
          await logRejection(video.id, video.snippet?.title, 'processing_error', err.message);
        }
      }
    }

    await IngestChannel.updateOne({ _id: channel._id }, { lastIngestedAt: new Date() });

    if (plData.nextPageToken) {
      pageToken = plData.nextPageToken;
    } else {
      pageToken = null;
      channelIdx += 1;
    }
  }

  await saveQuotaState({
    cursor: { channelIdx, pageToken },
    quotaUsed,
    quotaDate,
    summary: { processed, saved, rejected, quotaExhausted },
  });

  return { processed, saved, rejected, quotaExhausted, quotaUsed, dailyLimit };
}
