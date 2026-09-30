import IngestState from '../../models/IngestState.js';

export const DEFAULT_DAILY_LIMIT = Number(process.env.YOUTUBE_DAILY_QUOTA_LIMIT || 9000);
const JOB_NAME = 'youtube';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function loadQuotaState() {
  const state = (await IngestState.findOne({ jobName: JOB_NAME }).lean()) || {};
  const isToday = state.quotaDate === today();
  return {
    cursor: state.cursor || {},
    quotaUsed: isToday ? state.quotaUsed || 0 : 0,
    quotaDate: today(),
  };
}

export async function saveQuotaState({ cursor, quotaUsed, quotaDate, summary }) {
  await IngestState.findOneAndUpdate(
    { jobName: JOB_NAME },
    { cursor, quotaUsed, quotaDate, lastRunAt: new Date(), lastSummary: summary },
    { upsert: true }
  );
}

export function hasBudget(quotaUsed, cost, limit = DEFAULT_DAILY_LIMIT) {
  return quotaUsed + cost <= limit;
}
