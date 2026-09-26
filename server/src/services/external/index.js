import * as archiveorg from './archiveorg.js';
import * as wikimedia from './wikimediaCommons.js';
import * as nasa from './nasa.js';
import * as vimeo from './vimeo.js';
import * as blender from './blender.js';
import * as youtubeChannel from './youtubeChannel.js';

export const SOURCES = {
  archiveorg,
  prelinger: archiveorg, // same API, collection param distinguishes it
  wikimedia,
  nasa,
  vimeo,
  blender,
  youtube_channel: youtubeChannel,
};

export async function searchSource(source, params) {
  const impl = SOURCES[source];
  if (!impl) throw new Error(`unknown external source: ${source}`);
  return impl.search(params);
}

export async function resolvePlayback(source, refId) {
  const impl = SOURCES[source];
  if (!impl) throw new Error(`unknown external source: ${source}`);
  return impl.resolvePlayback(refId);
}
