export const EXTERNAL_ROW_MAPPING = {
  free_classics: { source: 'archiveorg', params: { query: 'feature film', collection: 'feature_films' } },
  prelinger_picks: { source: 'prelinger', params: { collection: 'prelinger' } },
  nasa_films: { source: 'nasa', params: { query: 'space exploration' } },
  blender_open_movies: { source: 'blender', params: {} },
  commons_shorts: { source: 'wikimedia', params: { query: 'documentary' } },
  vimeo_creative_commons: { source: 'vimeo', params: { query: 'documentary' } },
  nature_docs_natgeo: { source: 'youtube_channel', params: { channelId: 'UCDPk9MG2RexnOMGTD-YnSnA', rows: 24 }, ttlMs: 24 * 60 * 60 * 1000 },
};
