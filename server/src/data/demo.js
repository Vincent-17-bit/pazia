const GENRES = ['Drama', 'Thriller', 'Comedy', 'Romance', 'Action', 'Crime', 'Documentary'];

const TITLES = {
  home: ['Mathare Girls', 'Pazia', 'Utu', 'Vunja Mifupa', 'Siri', 'The Trial', 'Nairobi Half Life', 'Watu Wote'],
  tvshows: ['Sultana', 'Zora', 'Pete', 'Selina', 'Njoro wa Uba', 'Auntie Boss', 'Papa Sava', 'Mtakawana'],
  movies: ['Disconnect', '40 Sticks', 'Country Queen', 'Plan B', 'Poacher', 'The Battle of Nairobi', 'Sincerely Daisy', 'Click Click Bang'],
  series: ['Crime and Justice', 'Shanty Town', 'The Real House Helps', 'Njoro Wa Uba', 'K-24', 'Wingu La Moto', 'Machachari', 'Inspekta Mwala'],
  swahili: ['Zilizala', 'Aziza', 'Tujuane', 'Maria', 'Kina Mama', 'Sultana', 'Bahati', 'Msichana Wa Kiziwi'],
};

const TV_TABS = new Set(['tvshows', 'series', 'swahili']);

function slug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildItem(title, tab, i) {
  const mediaType = TV_TABS.has(tab) ? 'tv' : 'movie';
  return {
    id: `${slug(title)}`,
    mediaType,
    title,
    overview: `${title} follows a group of characters navigating ambition, loyalty and consequence against a backdrop that refuses to make things easy for them.`,
    posterPath: null,
    backdropPath: null,
    colorSeed: (title.length + i) % 6,
    rating: Number((6 + ((i * 37) % 35) / 10).toFixed(1)),
    year: 2020 + (i % 6),
    genres: [GENRES[i % GENRES.length], GENRES[(i + 2) % GENRES.length]],
  };
}

export const DEMO_ROWS = {};
for (const tab of Object.keys(TITLES)) {
  DEMO_ROWS[tab] = TITLES[tab].map((t, i) => buildItem(t, tab, i));
}

export const DEMO_ITEMS_BY_ID = {};
for (const tab of Object.keys(DEMO_ROWS)) {
  for (const item of DEMO_ROWS[tab]) {
    DEMO_ITEMS_BY_ID[`${item.mediaType}:${item.id}`] = item;
  }
}

export const EXTRA_ROWS = {
  trending: DEMO_ROWS.home.slice().reverse(),
  top_rated: DEMO_ROWS.movies.slice().sort((a, b) => b.rating - a.rating),
  new_releases: DEMO_ROWS.series,
  action: DEMO_ROWS.movies.filter((_, i) => i % 2 === 0),
  drama: DEMO_ROWS.tvshows,
  romance: DEMO_ROWS.swahili,
  comedy: DEMO_ROWS.series.filter((_, i) => i % 2 === 1),
  kids: DEMO_ROWS.tvshows.slice().reverse(),
  documentaries: DEMO_ROWS.movies.slice().reverse(),
  hindi: DEMO_ROWS.series,
  afro_nollywood: DEMO_ROWS.swahili.slice().reverse(),
  plays_theatre: DEMO_ROWS.home.filter((_, i) => i % 3 === 0),
};

export function demoSeasons(seriesId) {
  return [
    { seasonNumber: 1, episodeCount: 12, name: 'Season 1' },
    { seasonNumber: 2, episodeCount: 99, name: 'Season 2' },
  ];
}

export function demoEpisodes(seriesId, seasonNumber) {
  const count = seasonNumber === 2 ? 99 : 12;
  return Array.from({ length: count }, (_, i) => ({
    episodeNumber: i + 1,
    name: `Episode ${i + 1}`,
    overview: `Season ${seasonNumber}, Episode ${i + 1} continues the story of ${seriesId.replace(/-/g, ' ')}.`,
    stillPath: null,
    runtime: 24 + (i % 12),
    airDate: `202${1 + (seasonNumber % 4)}-0${1 + (i % 9)}-1${i % 9}`,
  }));
}

export const DEMO_CAST = [
  { name: 'A. Wanjiru', character: 'Lead', profilePath: null },
  { name: 'B. Otieno', character: 'Supporting', profilePath: null },
  { name: 'C. Njeri', character: 'Supporting', profilePath: null },
  { name: 'D. Kamau', character: 'Antagonist', profilePath: null },
];

export const DEMO_PROVIDERS = {
  KE: { flatrate: [{ name: 'Showmax' }], buy: [], rent: [] },
  US: { flatrate: [{ name: 'Netflix' }], buy: [], rent: [] },
};

export const TOP_SEARCHES = ['Mathare Girls', 'Pazia', 'Utu', 'Country Queen', 'Sultana'];
