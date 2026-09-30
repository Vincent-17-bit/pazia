export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// strip punctuation/case/diacritics so "Watu Wote: All of Us" and
// "watu wote all of us" dedupe against each other
export function normalizeTitleKey(title) {
  return (title || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function dedupeKey(title, year) {
  return `${normalizeTitleKey(title)}::${year || ''}`;
}

// crude but effective for movie-title matching: Dice coefficient over bigrams
export function titleSimilarity(a, b) {
  const na = normalizeTitleKey(a);
  const nb = normalizeTitleKey(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const bigrams = (s) => {
    const out = [];
    for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
    return out;
  };
  const ba = bigrams(na);
  const bb = bigrams(nb);
  if (!ba.length || !bb.length) return 0;
  const counts = new Map();
  for (const g of ba) counts.set(g, (counts.get(g) || 0) + 1);
  let hits = 0;
  for (const g of bb) {
    const c = counts.get(g) || 0;
    if (c > 0) {
      hits++;
      counts.set(g, c - 1);
    }
  }
  return (2 * hits) / (ba.length + bb.length);
}

// SxxExx, "Season 1 Episode 2", "Episode 4", "Ep. 4" — enough to tell a
// standalone film apart from a TV upload without a full NLP pass
const EP_PATTERNS = [
  /\bS(\d{1,2})[\s._-]*E(\d{1,3})\b/i,
  /\bSeason\s*(\d{1,2})[\s,._-]*Episode\s*(\d{1,3})\b/i,
  /\bEp(?:isode)?\.?\s*#?(\d{1,3})\b/i,
];

export function parseEpisodeInfo(title) {
  const m1 = EP_PATTERNS[0].exec(title) || EP_PATTERNS[1].exec(title);
  if (m1) {
    return {
      isEpisode: true,
      season: Number(m1[1]),
      episode: Number(m1[2]),
      seriesTitle: title.slice(0, m1.index).replace(/[-:|(]+$/, '').trim() || title,
    };
  }
  const m2 = EP_PATTERNS[2].exec(title);
  if (m2) {
    return {
      isEpisode: true,
      season: 1,
      episode: Number(m2[1]),
      seriesTitle: title.slice(0, m2.index).replace(/[-:|(]+$/, '').trim() || title,
    };
  }
  return { isEpisode: false, season: null, episode: null, seriesTitle: title };
}

export function seriesKeyFor(channelOrCollection, seriesTitle) {
  return `${channelOrCollection}::${normalizeTitleKey(seriesTitle)}`;
}

const OPEN_LICENSE_PATTERNS = [
  /publicdomain/i,
  /\bpublic[- ]domain\b/i,
  /\bcc0\b/i,
  /creativecommons\.org\/(licenses|publicdomain)/i,
  /\bby-sa\b/i,
  /\bby\b.*4\.0/i,
  /\busgov\b/i,
  /\bnasa\b/i,
];

const CLOSED_LICENSE_PATTERNS = [
  /\ball rights reserved\b/i,
  /\bborrow\b/i,
  /\brestricted\b/i,
  /\bin[- ]copyright\b/i,
  /\bno[- ]commercial\b/i,
  /\bprint[- ]disabled\b/i,
];

export function classifyLicense(licenseUrlOrText) {
  const s = licenseUrlOrText || '';
  if (CLOSED_LICENSE_PATTERNS.some((re) => re.test(s))) return null;
  if (OPEN_LICENSE_PATTERNS.some((re) => re.test(s))) return s;
  return null;
}
