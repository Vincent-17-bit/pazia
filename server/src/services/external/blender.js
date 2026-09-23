import { normalizeExternal } from '../externalNormalize.js';
import { resolvePlayback as archiveResolve } from './archiveorg.js';

// no public search API for these - Blender Foundation's official open movie catalog
const CATALOG = [
  { id: 'BigBuckBunny_124', title: 'Big Buck Bunny', year: 2008, overview: 'A giant rabbit deals with three bullying rodents, from the Blender Institute.' },
  { id: 'Sintel', title: 'Sintel', year: 2010, overview: 'A lonely girl searches for a baby dragon she calls Scales.' },
  { id: 'TearsOfSteel', title: 'Tears of Steel', year: 2012, overview: 'A group of warriors and scientists gather to reclaim earth from robots.' },
  { id: 'ElephantsDream', title: 'Elephants Dream', year: 2006, overview: 'Two characters explore a machine-like surreal world.' },
  { id: 'CosmosLaundromatFirstCycle', title: 'Cosmos Laundromat', year: 2015, overview: 'A suicidal sheep is given one last chance by an eccentric angel.' },
  { id: 'Spring_1', title: 'Spring', year: 2019, overview: 'A shepherdess and her dog explore an open world full of spirits.' },
];

export async function search() {
  return CATALOG.map((m) =>
    normalizeExternal({
      source: 'blender',
      refId: m.id,
      title: m.title,
      overview: m.overview,
      posterPath: `https://archive.org/services/img/${m.id}`,
      year: m.year,
      license: 'creative_commons',
    })
  );
}

export async function resolvePlayback(refId) {
  return archiveResolve(refId);
}
