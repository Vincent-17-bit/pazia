import IngestCollection from '../../models/IngestCollection.js';
import ExternalTitle from '../../models/ExternalTitle.js';
import IngestRejection from '../../models/IngestRejection.js';
import IngestBlock from '../../models/IngestBlock.js';
import IngestState from '../../models/IngestState.js';
import { probeMp4DurationSeconds } from '../mp4Duration.js';
import { matchTmdb } from './tmdbMatch.js';
import { classifyRows } from './rowClassify.js';
import { sleep, classifyLicense, parseEpisodeInfo, seriesKeyFor } from './common.js';
import { SEED_COLLECTIONS } from './seedData.js';

const SEARCH_URL = 'https://archive.org/advancedsearch.php';
const META_URL = (id) => `https://archive.org/metadata/${id}`;
const THUMB_URL = (id) => `https://archive.org/services/img/${id}`;
const PAGE_ROWS = 50;
const REQUEST_DELAY_MS = 350; // stay well under archive.org's polite-use guidance
const MIN_RUNTIME_MIN = 40;
const REFRESH_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
const YEAR_WINDOW = 5;
const MIN_YEAR = 1900;
const VIDEO_EXT = /\.(mp4|m4v|ogv|webm)$/i;

const JOB_NAME = 'archiveorg';

function currentYear() {
  return new Date().getFullYear();
}

function yearWindows() {
  const out = [];
  for (let y = MIN_YEAR; y <= currentYear(); y += YEAR_WINDOW) {
    out.push([y, Math.min(y + YEAR_WINDOW - 1, currentYear() + 1)]);
  }
  return out;
}

export async function ensureSeedCollections() {
  const count = await IngestCollection.countDocuments();
  if (count > 0) return;
  await IngestCollection.insertMany(SEED_COLLECTIONS.map((c) => ({ ...c, active: true })));
}

async function searchPage(collection, subjectFilter, [yStart, yEnd], page) {
  const clauses = [`collection:(${collection})`, 'mediatype:(movies)', `year:[${yStart} TO ${yEnd}]`];
  if (subjectFilter) clauses.push(`subject:(${subjectFilter})`);
  const url = new URL(SEARCH_URL);
  url.searchParams.set('q', clauses.join(' AND '));
  ['identifier', 'title', 'description', 'year', 'downloads', 'licenseurl', 'subject', 'language']
    .forEach((f) => url.searchParams.append('fl[]', f));
  url.searchParams.set('sort[]', 'downloads desc');
  url.searchParams.set('rows', String(PAGE_ROWS));
  url.searchParams.set('page', String(page));
  url.searchParams.set('output', 'json');

  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`archive.org search ${res.status}`);
  const data = await res.json();
  return data.response?.docs || [];
}

function parseRuntimeMinutesFromMeta(meta) {
  const raw = meta?.runtime;
  if (!raw) return null;
  const hms = /^(\d+):(\d{2}):(\d{2})$/.exec(raw);
  if (hms) return Math.round((Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3])) / 60);
  const ms = /^(\d+):(\d{2})$/.exec(raw);
  if (ms) return Math.round((Number(ms[1]) * 60 + Number(ms[2])) / 60);
  const num = parseFloat(raw);
  return Number.isFinite(num) ? Math.round(num) : null;
}

async function fetchDetail(identifier) {
  const res = await fetch(META_URL(identifier), { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`archive.org metadata ${res.status}`);
  return res.json();
}

async function logRejection(source, sourceId, title, reason, detail = null) {
  try {
    await IngestRejection.create({ source, sourceId, title, reason, detail });
  } catch {
    // best-effort logging only
  }
}

async function processItem(doc, category, collectionName) {
  const identifier = doc.identifier;
  if (!identifier) return { skipped: true };

  const blocked = await IngestBlock.findOne({ source: 'archiveorg', sourceId: identifier }).lean();
  if (blocked) return { skipped: true };

  const existing = await ExternalTitle.findOne({ source: 'archiveorg', sourceId: identifier }).lean();
  if (existing && Date.now() - new Date(existing.lastRefreshedAt).getTime() < REFRESH_AFTER_MS) {
    return { skipped: true };
  }

  await sleep(REQUEST_DELAY_MS);
  let detail;
  try {
    detail = await fetchDetail(identifier);
  } catch (err) {
    await logRejection('archiveorg', identifier, doc.title, 'metadata_fetch_failed', err.message);
    return { rejected: true };
  }

  const meta = detail.metadata || {};
  const licenseText = meta.licenseurl || meta.license || doc.licenseurl || '';
  const license = classifyLicense(licenseText);
  if (!license) {
    await logRejection('archiveorg', identifier, doc.title, 'unclear_or_restricted_license', licenseText || 'none found');
    return { rejected: true };
  }
  if (meta.access === 'restricted' || meta['collection-lending'] || /lending/i.test(collectionName)) {
    await logRejection('archiveorg', identifier, doc.title, 'borrow_only');
    return { rejected: true };
  }

  const files = detail.files || [];
  const videoFiles = files.filter((f) => VIDEO_EXT.test(f.name || ''));
  if (!videoFiles.length) {
    await logRejection('archiveorg', identifier, doc.title, 'no_video_file');
    return { rejected: true };
  }
  const mainFile = videoFiles.sort((a, b) => Number(b.size || 0) - Number(a.size || 0))[0];
  const mp4File = videoFiles.find((f) => /\.mp4$/i.test(f.name)) || null;

  let runtimeMinutes = parseRuntimeMinutesFromMeta(meta);
  if (!runtimeMinutes && mp4File) {
    const url = `https://archive.org/download/${identifier}/${encodeURIComponent(mp4File.name)}`;
    const seconds = await probeMp4DurationSeconds(url, { timeoutMs: 7000 });
    if (seconds) runtimeMinutes = Math.round(seconds / 60);
  }
  if (!runtimeMinutes && mainFile.length) {
    runtimeMinutes = Math.round(Number(mainFile.length) / 60);
  }

  const title = doc.title || identifier;
  const epInfo = parseEpisodeInfo(title);
  const qualifiesAsEpisode = epInfo.isEpisode && category === 'classic_tv';

  if ((!runtimeMinutes || runtimeMinutes < MIN_RUNTIME_MIN) && !qualifiesAsEpisode) {
    await logRejection('archiveorg', identifier, title, 'too_short', `${runtimeMinutes || 0} min`);
    return { rejected: true };
  }

  const year = doc.year ? String(doc.year).slice(0, 4) : null;
  const language = Array.isArray(meta.language) ? meta.language[0] : meta.language || null;

  let tmdb = null;
  try {
    tmdb = await matchTmdb(qualifiesAsEpisode ? epInfo.seriesTitle : title, year, qualifiesAsEpisode ? 'tv' : 'movie');
  } catch {
    tmdb = null;
  }

  const { rows, genre } = classifyRows({
    archiveCategory: category,
    tmdbGenreIds: tmdb?.genreIds || [],
    tmdbMediaType: tmdb?.tmdbMediaType,
    language,
    runtimeMinutes: runtimeMinutes || 0,
    isEpisode: qualifiesAsEpisode,
  });

  const playback = mp4File
    ? { type: 'mp4', url: `https://archive.org/download/${identifier}/${encodeURIComponent(mp4File.name)}` }
    : { type: 'iframe', url: `https://archive.org/embed/${identifier}` };

  const docPayload = {
    source: 'archiveorg',
    sourceId: identifier,
    mediaType: qualifiesAsEpisode ? 'tv' : 'movie',
    seriesKey: qualifiesAsEpisode ? seriesKeyFor(collectionName, epInfo.seriesTitle) : null,
    season: qualifiesAsEpisode ? epInfo.season : null,
    episode: qualifiesAsEpisode ? epInfo.episode : null,
    title: qualifiesAsEpisode ? epInfo.seriesTitle : title,
    description: (Array.isArray(meta.description) ? meta.description[0] : meta.description) || '',
    runtimeMinutes: runtimeMinutes || MIN_RUNTIME_MIN,
    genre,
    year,
    language,
    posterPath: tmdb?.posterPath || THUMB_URL(identifier),
    backdropPath: tmdb?.backdropPath || THUMB_URL(identifier),
    playback,
    license,
    downloads: Number(doc.downloads) || 0,
    rows,
    tmdbId: tmdb?.tmdbId || null,
    tmdbMediaType: tmdb?.tmdbMediaType || null,
    tmdbAttribution: Boolean(tmdb),
    collection: collectionName,
    embeddable: true,
    status: 'active',
    statusReason: null,
    lastRefreshedAt: new Date(),
  };

  await ExternalTitle.findOneAndUpdate(
    { source: 'archiveorg', sourceId: identifier, season: docPayload.season, episode: docPayload.episode },
    docPayload,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return { saved: true };
}

// One bounded pass. Cursor walks collection -> year-window -> page so a
// single collection can be split well past archive.org's 10,000-result cap
// on any one search. Persists to IngestState so the next tick resumes here.
export async function runArchiveTick({ budgetMs = 8000, maxItems = 20 } = {}) {
  await ensureSeedCollections();
  const collections = await IngestCollection.find({ active: true }).sort({ _id: 1 }).lean();
  if (!collections.length) return { processed: 0, saved: 0, rejected: 0, done: true };

  const windows = yearWindows();
  const state = (await IngestState.findOne({ jobName: JOB_NAME }).lean()) || { cursor: {} };
  let { collectionIdx = 0, windowIdx = windows.length - 1, page = 1 } = state.cursor || {};
  // start from the most recent year window - "most downloaded first" plus
  // newest-first makes early ticks land on today's most-requested content

  const started = Date.now();
  let processed = 0, saved = 0, rejected = 0;

  while (Date.now() - started < budgetMs && processed < maxItems) {
    if (collectionIdx >= collections.length) { collectionIdx = 0; }
    const col = collections[collectionIdx];
    if (windowIdx < 0) { windowIdx = windows.length - 1; collectionIdx += 1; page = 1; continue; }

    let docs;
    try {
      docs = await searchPage(col.collection, col.subjectFilter, windows[windowIdx], page);
    } catch (err) {
      await logRejection('archiveorg', col.collection, '', 'search_failed', err.message);
      docs = [];
    }
    await sleep(REQUEST_DELAY_MS);

    if (!docs.length) {
      windowIdx -= 1;
      page = 1;
      continue;
    }

    for (const doc of docs) {
      if (Date.now() - started >= budgetMs || processed >= maxItems) break;
      processed += 1;
      try {
        const result = await processItem(doc, col.category, col.collection);
        if (result?.saved) saved += 1;
        if (result?.rejected) rejected += 1;
      } catch (err) {
        rejected += 1;
        await logRejection('archiveorg', doc.identifier || 'unknown', doc.title, 'processing_error', err.message);
      }
    }

    if (docs.length < PAGE_ROWS) { windowIdx -= 1; page = 1; } else { page += 1; }
  }

  await IngestState.findOneAndUpdate(
    { jobName: JOB_NAME },
    { cursor: { collectionIdx, windowIdx, page }, lastRunAt: new Date(), lastSummary: { processed, saved, rejected } },
    { upsert: true }
  );

  return { processed, saved, rejected, done: false };
}
