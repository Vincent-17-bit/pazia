// shape matches normalizeItem() so PosterCard/Row need no changes
export function normalizeExternal({ source, refId, title, overview, posterPath, year, mediaType = 'movie', playback = null, license = 'public_domain' }) {
  return {
    id: `${source}:${refId}`,
    mediaType: 'external',
    realMediaType: mediaType,
    title: title || 'Untitled',
    overview: overview || '',
    posterPath: posterPath || null,
    backdropPath: posterPath || null,
    rating: null,
    year: year || null,
    genreIds: [],
    external: true,
    source,
    refId: String(refId),
    playback,
    license,
  };
}
