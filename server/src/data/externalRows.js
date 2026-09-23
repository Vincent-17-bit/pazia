export const EXTERNAL_ROW_MAPPING = {
  free_classics: { source: 'archiveorg', params: { query: 'feature film', collection: 'feature_films' } },
  prelinger_picks: { source: 'prelinger', params: { collection: 'prelinger' } },
  nasa_films: { source: 'nasa', params: { query: 'space exploration' } },
  blender_open_movies: { source: 'blender', params: {} },
  commons_shorts: { source: 'wikimedia', params: { query: 'documentary' } },
  vimeo_creative_commons: { source: 'vimeo', params: { query: 'documentary' } },
};
