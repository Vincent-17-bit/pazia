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

  // discovery
  fresh_off_press: { source: 'discover', mediaType: 'movie', params: { sort_by: 'primary_release_date.desc', 'vote_count.gte': 20 } },
  critics_favourites: { source: 'discover', mediaType: 'movie', params: { sort_by: 'vote_average.desc', 'vote_count.gte': 500 } },
  coming_soon: { source: 'discover', mediaType: 'movie', params: { sort_by: 'primary_release_date.asc', 'primary_release_date.gte': new Date().toISOString().slice(0, 10) } },
  hidden_gems: { source: 'discover', mediaType: 'movie', params: { sort_by: 'popularity.asc', 'vote_average.gte': 7, 'vote_count.gte': 50, 'vote_count.lte': 1000 } },
  award_winners: { source: 'discover', mediaType: 'movie', params: { sort_by: 'vote_average.desc', 'vote_average.gte': 7.5, 'vote_count.gte': 1000 } },
  timeless_classics: { source: 'discover', mediaType: 'movie', params: { sort_by: 'vote_average.desc', 'vote_average.gte': 7, 'primary_release_date.lte': '2000-01-01' } },
  short_and_sweet: { source: 'discover', mediaType: 'movie', params: { sort_by: 'popularity.desc', 'with_runtime.lte': 40 } },
  binge_weekend: { source: 'discover', mediaType: 'tv', params: { sort_by: 'popularity.desc' } },

  // regional
  swahili_stories: { source: 'discover_swahili', mediaType: 'both' },
  made_in_east_africa: { source: 'discover', mediaType: 'movie', params: { with_origin_country: 'KE|TZ|UG', sort_by: 'popularity.desc' } },
  nollywood_naija: { source: 'discover', mediaType: 'movie', params: { with_origin_country: 'NG', sort_by: 'popularity.desc' } },
  afro_wave: { source: 'discover', mediaType: 'movie', params: { with_origin_country: 'GH|ZA', sort_by: 'popularity.desc' } },
  bollywood_blockbusters: { source: 'discover', mediaType: 'movie', params: { with_original_language: 'hi', sort_by: 'popularity.desc' } },
  bollywood_love_stories: { source: 'discover', mediaType: 'movie', params: { with_original_language: 'hi', with_genres: '10749' } },
  kdrama_fever: { source: 'discover', mediaType: 'tv', params: { with_original_language: 'ko', sort_by: 'popularity.desc' } },
  turkish_drama_nights: { source: 'discover', mediaType: 'tv', params: { with_original_language: 'tr', sort_by: 'popularity.desc' } },
  anime_zone: { source: 'discover_multi', paramsByType: { movie: { with_genres: '16', with_original_language: 'ja' }, tv: { with_genres: '16', with_original_language: 'ja' } } },
  telenovela_time: { source: 'discover', mediaType: 'tv', params: { with_original_language: 'es', with_genres: '10766' } },
  world_cinema: { source: 'discover_merge', mediaType: 'movie', paramsList: [
    { with_original_language: 'fr' }, { with_original_language: 'es' }, { with_original_language: 'de' }, { with_original_language: 'ko' },
  ] },

  // genres
  thriller: { source: 'discover', mediaType: 'movie', params: { with_genres: '53' } },
  horror: { source: 'discover', mediaType: 'movie', params: { with_genres: '27' } },
  scifi_fantasy: { source: 'discover', mediaType: 'movie', params: { with_genres: '878|14' } },
  epic_tales: { source: 'discover', mediaType: 'movie', params: { with_genres: '12|14|36' } },
  biopics: { source: 'discover', mediaType: 'movie', params: { with_genres: '36,18' } },
  mystery: { source: 'discover', mediaType: 'movie', params: { with_genres: '9648' } },

  // crime and underworld collection
  crime_underworld: { source: 'discover', mediaType: 'movie', params: { with_genres: '80', sort_by: 'popularity.desc' } },
  whodunit: { source: 'discover', mediaType: 'movie', params: { with_genres: '9648|80', sort_by: 'vote_average.desc', 'vote_count.gte': 100 } },
  kingpins: { source: 'discover', mediaType: 'movie', params: { with_genres: '80', sort_by: 'popularity.desc', 'vote_count.gte': 100 } },
  mob_rules: { source: 'discover_keyword_query', mediaType: 'movie', keywordQuery: 'mafia', params: { with_genres: '80' } },
  cartel_chronicles: { source: 'discover_keyword_query', mediaType: 'movie', keywordQuery: 'drug cartel', params: { with_genres: '80' } },
  code_red: { source: 'discover_keyword_query', mediaType: 'movie', keywordQuery: 'heist', params: { with_genres: '80|53' } },

  // plays & theatre
  center_stage: { source: 'discover_keyword', mediaType: 'movie' },
  curtain_up: { source: 'discover_keyword_query', mediaType: 'movie', keywordQuery: 'stage play', params: { sort_by: 'release_date.desc' } },
  comedy_on_stage: { source: 'discover_keyword_query', mediaType: 'movie', keywordQuery: 'stand-up comedy' },
  live_in_concert: { source: 'discover', mediaType: 'movie', params: { with_genres: '10402' } },
  behind_the_scenes: { source: 'discover_keyword_query', mediaType: 'movie', keywordQuery: 'behind the scenes', params: { with_genres: '99' } },

  // kids & family
  toon_town: { source: 'discover', mediaType: 'movie', params: { with_genres: '16' } },
  kids_corner: { source: 'discover', mediaType: 'movie', params: { with_genres: '10751' } },
  teen_vibes: { source: 'discover_keyword_query', mediaType: 'movie', keywordQuery: 'teenager', params: { with_genres: '18|35' } },
  bedtime_stories: { source: 'discover', mediaType: 'movie', params: { with_genres: '10751', 'with_runtime.lte': 60 } },

  // moods
  faith_inspiration: { source: 'discover_keyword_query', mediaType: 'movie', keywordQuery: 'christian film' },
  feel_good: { source: 'discover_keyword_query', mediaType: 'movie', keywordQuery: 'feel good' },
  date_night: { source: 'discover', mediaType: 'movie', params: { with_genres: '10749|35' } },
  wild_planet: { source: 'discover_keyword_query', mediaType: 'movie', keywordQuery: 'nature documentary', params: { with_genres: '99' } },
  game_day: { source: 'discover_keyword_query', mediaType: 'movie', keywordQuery: 'sports', params: { with_genres: '99|18' } },
  reality_rush: { source: 'discover', mediaType: 'tv', params: { with_genres: '10764' } },
};
