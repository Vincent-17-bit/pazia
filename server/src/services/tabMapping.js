export const TAB_MAPPING = {
  home: { source: 'trending', mediaType: 'all' },
  tvshows: { source: 'discover', mediaType: 'tv', params: { sort_by: 'popularity.desc' } },
  movies: { source: 'discover', mediaType: 'movie', params: { sort_by: 'popularity.desc' } },
  series: { source: 'discover', mediaType: 'tv', params: { sort_by: 'popularity.desc', with_genres: '18' } },
  swahili: { source: 'discover_swahili', mediaType: 'both', params: { with_original_language: 'sw' } },
};

export const ROW_MAPPING = {
  trending: { source: 'trending', mediaType: 'all' },
  top_rated: { source: 'discover', mediaType: 'movie', params: { sort_by: 'vote_average.desc', 'vote_count.gte': 200 } },
  new_releases: { source: 'discover', mediaType: 'movie', params: { sort_by: 'release_date.desc' } },
  action: { source: 'discover', mediaType: 'movie', params: { with_genres: '28' } },
  drama: { source: 'discover', mediaType: 'movie', params: { with_genres: '18' } },
  romance: { source: 'discover', mediaType: 'movie', params: { with_genres: '10749' } },
  comedy: { source: 'discover', mediaType: 'movie', params: { with_genres: '35' } },
  kids: { source: 'discover', mediaType: 'movie', params: { with_genres: '10751' } },
  documentaries: { source: 'discover', mediaType: 'movie', params: { with_genres: '99' } },
  hindi: { source: 'discover', mediaType: 'movie', params: { with_original_language: 'hi' } },
  afro_nollywood: { source: 'discover', mediaType: 'movie', params: { with_original_language: 'yo' } },
  plays_theatre: { source: 'discover_keyword', mediaType: 'movie' },
};
