import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import Hero from '../components/Hero.jsx';
import TabsBar from '../components/TabsBar.jsx';
import Row from '../components/Row.jsx';
import ContinueWatchingRow from '../components/ContinueWatchingRow.jsx';
import { useContinueWatching } from '../hooks/useContinueWatching.js';

const ROW_KEYS = [
  ['trending', 'Trending'],
  ['top_rated', 'Top Rated'],
  ['new_releases', 'New Releases'],
  ['action', 'Action'],
  ['drama', 'Drama'],
  ['romance', 'Romance'],
  ['comedy', 'Comedy'],
  ['kids', 'Kids'],
  ['documentaries', 'Documentaries'],
  ['hindi', 'Hindi'],
  ['afro_nollywood', 'Afro/Nollywood'],
  ['plays_theatre', 'Plays & Theatre'],
];

export default function Home() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'home';
  const [featured, setFeatured] = useState(null);

  const heroQuery = useQuery({
    queryKey: ['hero', tab],
    queryFn: () => api.hero(tab),
  });

  const browseQuery = useQuery({
    queryKey: ['browse', tab],
    queryFn: () => api.browse(tab, 1),
  });

  const rowsQuery = useQuery({
    queryKey: ['rows'],
    queryFn: () => api.rows(ROW_KEYS.map(([k]) => k)),
  });

  const cw = useContinueWatching();

  useEffect(() => {
    if (heroQuery.data?.featured) setFeatured(heroQuery.data.featured);
  }, [heroQuery.data]);

  function setTab(next) {
    setParams(next === 'home' ? {} : { tab: next });
  }

  const TAB_LABEL = { home: 'Home', tvshows: 'TV Shows', movies: 'Movies', series: 'Series', swahili: 'Swahili' };
  const rowsByKey = Object.fromEntries((rowsQuery.data?.rows || []).map((r) => [r.key, r.items]));

  return (
    <>
      <TabsBar active={tab} onChange={setTab} />
      <div className="pt-[calc(120px+env(safe-area-inset-top,0px))]">
        <Hero featured={featured} strip={heroQuery.data?.strip} onStripSelect={setFeatured} />
        <ContinueWatchingRow items={cw.data} loading={cw.isLoading} onSeedDemo={cw.seedDemo} />
        <Row title={TAB_LABEL[tab]} items={browseQuery.data?.items} loading={browseQuery.isLoading} />
        {ROW_KEYS.map(([key, label]) => (
          <Row key={key} title={label} items={rowsByKey[key]} loading={rowsQuery.isLoading} lazy />
        ))}
      </div>
    </>
  );
}
