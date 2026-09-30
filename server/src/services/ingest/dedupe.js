import ExternalTitle from '../../models/ExternalTitle.js';
import { normalizeTitleKey } from './common.js';

// Runs after both sources ingest. When the same film exists from both
// Archive.org and YouTube, keeps the higher-runtime/higher-rank copy and
// hides the other rather than showing the title twice on the homepage.
export async function runDedupeTick({ limit = 500 } = {}) {
  const docs = await ExternalTitle.find({ status: 'active', mediaType: 'movie' })
    .select('_id title year runtimeMinutes source downloads')
    .limit(limit)
    .lean();

  const groups = new Map();
  for (const d of docs) {
    const k = `${normalizeTitleKey(d.title)}::${d.year || ''}`;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(d);
  }

  let hidden = 0;
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => (b.runtimeMinutes - a.runtimeMinutes) || ((b.downloads || 0) - (a.downloads || 0)));
    const [, ...rest] = group;
    for (const dupe of rest) {
      await ExternalTitle.updateOne({ _id: dupe._id }, { status: 'hidden', statusReason: 'duplicate' });
      hidden += 1;
    }
  }
  return { groupsChecked: groups.size, hidden };
}
