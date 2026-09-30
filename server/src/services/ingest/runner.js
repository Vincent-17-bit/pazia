import { runArchiveTick } from './archiveIngest.js';
import { runYoutubeTick } from './youtubeIngest.js';
import { runYoutubeRefreshTick } from './refresh.js';
import { runDedupeTick } from './dedupe.js';

// A single bounded "tick" of the whole pipeline, sized to comfortably fit
// inside a serverless function's timeout. State persists between ticks
// (IngestState cursors, per-title lastRefreshedAt) so repeated calls -
// from a cron job, GitHub Actions, or a manual admin trigger - resume
// exactly where the last one left off rather than restarting.
export async function runIngestTick() {
  const [archive, youtube] = await Promise.all([
    runArchiveTick({ budgetMs: 8000, maxItems: 20 }).catch((err) => ({ error: err.message })),
    runYoutubeTick({ budgetMs: 8000, maxItems: 40 }).catch((err) => ({ error: err.message })),
  ]);
  const refresh = await runYoutubeRefreshTick({ maxBatches: 2 }).catch((err) => ({ error: err.message }));
  const dedupe = await runDedupeTick({ limit: 300 }).catch((err) => ({ error: err.message }));

  return { archive, youtube, refresh, dedupe, at: new Date().toISOString() };
}
