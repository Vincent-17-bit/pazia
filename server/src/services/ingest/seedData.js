// Starter lists only - both are fully editable from the admin page without
// a code change. Archive.org collection slugs occasionally get renamed, and
// YouTube handles are resolved (and verified) against the API on first run,
// so a bad entry here just gets skipped rather than breaking the job.

export const SEED_COLLECTIONS = [
  { collection: 'feature_films', category: 'film' },
  { collection: 'classic_tv', category: 'classic_tv' },
  { collection: 'prelinger', category: 'documentary' },
  { collection: 'animationandcartoons', category: 'animation' },
  { collection: 'feature_films', subjectFilter: 'war', category: 'war' },
  { collection: 'classic_tv', subjectFilter: 'war', category: 'war' },
  { collection: 'feature_films', subjectFilter: 'Africa', category: 'africa_swahili' },
  { collection: 'feature_films', subjectFilter: 'Swahili', category: 'africa_swahili' },
  { collection: 'feature_films', subjectFilter: 'Nigeria', category: 'africa_swahili' },
];

export const SEED_CHANNELS = [
  { handle: '@nollywoodmoviesonyoutube', label: 'NollywoodMoviesTV', categories: ['nollywood'] },
  { handle: '@RocketBoys', label: 'RocketBoys', categories: ['bollywood'] },
  { handle: '@YRF', label: 'Yash Raj Films', categories: ['bollywood'] },
  { handle: '@nationalgeographic', label: 'National Geographic', categories: ['documentary'] },
  { handle: '@PBS', label: 'PBS', categories: ['documentary'] },
];
