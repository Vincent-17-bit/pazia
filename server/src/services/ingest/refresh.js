import ExternalTitle from '../../models/ExternalTitle.js';
import { hasYoutubeKey } from './youtubeIngest.js';

const API = 'https://www.googleapis.com/youtube/v3';
const REFRESH_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const BATCH = 50;

// YouTube data must be refreshed or deleted every 30 days, and we should
// regularly confirm each video still exists/embeds. Archive.org items are
// static files so they're just re-checked less aggressively (handled by
// the normal re-ingest TTL in archiveIngest.js).
export async function runYoutubeRefreshTick({ maxBatches = 3 } = {}) {
  if (!hasYoutubeKey()) return { checked: 0, refreshed: 0, removed: 0, noKey: true };

  const stale = await ExternalTitle.find({
    source: 'youtube',
    status: 'active',
    lastRefreshedAt: { $lt: new Date(Date.now() - REFRESH_WINDOW_MS) },
  })
    .limit(maxBatches * BATCH)
    .lean();

  if (!stale.length) return { checked: 0, refreshed: 0, removed: 0 };

  let checked = 0, refreshed = 0, removed = 0;
  for (let i = 0; i < stale.length; i += BATCH) {
    const batch = stale.slice(i, i + BATCH);
    const url = new URL(`${API}/videos`);
    url.searchParams.set('part', 'status');
    url.searchParams.set('id', batch.map((b) => b.sourceId).join(','));
    url.searchParams.set('key', process.env.YOUTUBE_API_KEY);

    let data;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      data = await res.json();
    } catch {
      continue;
    }
    const byId = new Map((data.items || []).map((v) => [v.id, v.status]));

    for (const item of batch) {
      checked += 1;
      const status = byId.get(item.sourceId);
      const stillGood = status && status.privacyStatus === 'public' && status.embeddable !== false;
      if (stillGood) {
        await ExternalTitle.updateOne({ _id: item._id }, { lastRefreshedAt: new Date() });
        refreshed += 1;
      } else {
        await ExternalTitle.updateOne(
          { _id: item._id },
          { status: 'hidden', statusReason: 'no_longer_available_or_embeddable' }
        );
        removed += 1;
      }
    }
  }
  return { checked, refreshed, removed };
}
