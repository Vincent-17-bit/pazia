import { registry } from '../genres.js';

// War is folded into Action + Epic Tales rather than getting its own row,
// per site decision - there's no standalone "War" row on the homepage.
const CATEGORY_ROWS = {
  film: ['trending'],
  classic_tv: ['timeless_classics'],
  documentary: ['documentaries'],
  animation: ['toon_town'],
  war: ['action', 'epic_tales'],
  africa_swahili: ['swahili_stories', 'made_in_east_africa', 'afro_wave'],
};

const CHANNEL_CATEGORY_ROWS = {
  nollywood: ['nollywood_naija', 'afro_wave'],
  swahili: ['swahili_stories', 'made_in_east_africa'],
  bollywood: ['hindi', 'bollywood_blockbusters'],
  documentary: ['documentaries'],
  cartoons: ['toon_town', 'kids_corner'],
  kids: ['kids_corner', 'bedtime_stories'],
};

const GENRE_ID_TO_ROW = {
  28: 'action',
  35: 'comedy',
  18: 'drama',
  10749: 'romance',
  27: 'horror',
  53: 'thriller',
  9648: 'mystery',
  878: 'scifi_fantasy',
  14: 'scifi_fantasy',
  12: 'epic_tales',
  36: 'biopics',
  99: 'documentaries',
  16: 'toon_town',
  10751: 'kids_corner',
};

function genreNamesFromIds(ids, mediaType) {
  const list = mediaType === 'tv' ? registry.tvGenres : registry.movieGenres;
  const byId = new Map(list.map((g) => [g.id, g.name]));
  return (ids || []).map((id) => byId.get(id)).filter(Boolean);
}

// Produces the set of existing ROW_MAPPING keys a title should appear in,
// plus its genre name list for display. Never invents a new row - only
// tags into rows that already exist on the homepage.
export function classifyRows({ archiveCategory, channelCategories = [], tmdbGenreIds = [], tmdbMediaType, language, runtimeMinutes, isEpisode }) {
  const rows = new Set();

  if (archiveCategory && CATEGORY_ROWS[archiveCategory]) {
    CATEGORY_ROWS[archiveCategory].forEach((r) => rows.add(r));
  }
  for (const cat of channelCategories) {
    (CHANNEL_CATEGORY_ROWS[cat] || []).forEach((r) => rows.add(r));
  }
  for (const id of tmdbGenreIds) {
    if (GENRE_ID_TO_ROW[id]) rows.add(GENRE_ID_TO_ROW[id]);
  }
  if (language === 'hi') { rows.add('hindi'); rows.add('bollywood_blockbusters'); }
  if (language === 'sw') { rows.add('swahili_stories'); rows.add('made_in_east_africa'); }
  if (isEpisode) rows.add('binge_weekend');
  if (runtimeMinutes >= 90) rows.add('trending');

  const genre = genreNamesFromIds(tmdbGenreIds, tmdbMediaType);
  return { rows: [...rows], genre };
}
