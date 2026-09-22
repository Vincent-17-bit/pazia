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
  ['fresh_off_press', 'Fresh Off the Press'],
  ['critics_favourites', "Critics' Favourites"],
  ['coming_soon', 'Coming Soon'],
  ['hidden_gems', 'Hidden Gems'],
  ['award_winners', 'Award Winners'],
  ['timeless_classics', 'Timeless Classics'],
  ['short_and_sweet', 'Short and Sweet'],
  ['binge_weekend', 'Binge in a Weekend'],
  ['action', 'Action'],
  ['thriller', 'Thriller'],
  ['crime_underworld', 'Crime and Underworld'],
  ['whodunit', 'Whodunit'],
  ['kingpins', 'Kingpins'],
  ['mob_rules', 'Mob Rules'],
  ['cartel_chronicles', 'Cartel Chronicles'],
  ['code_red', 'Code Red'],
  ['horror', 'Horror'],
  ['scifi_fantasy', 'Sci-Fi & Fantasy'],
  ['epic_tales', 'Epic Tales'],
  ['biopics', 'Biopics'],
  ['mystery', 'Mystery'],
  ['drama', 'Drama'],
  ['romance', 'Romance'],
  ['comedy', 'Comedy'],
  ['kids', 'Kids'],
  ['documentaries', 'Documentaries'],
  ['hindi', 'Hindi'],
  ['bollywood_blockbusters', 'Bollywood Blockbusters'],
  ['bollywood_love_stories', 'Bollywood Love Stories'],
  ['kdrama_fever', 'K-Drama Fever'],
  ['turkish_drama_nights', 'Turkish Drama Nights'],
  ['anime_zone', 'Anime Zone'],
  ['telenovela_time', 'Telenovela Time'],
  ['world_cinema', 'World Cinema'],
  ['afro_nollywood', 'Afro/Nollywood'],
  ['nollywood_naija', 'Nollywood Nights'],
  ['afro_wave', 'Afro Wave'],
  ['made_in_east_africa', 'Made in East Africa'],
  ['swahili_stories', 'Sinema Yetu'],
  ['plays_theatre', 'Plays & Theatre'],
  ['center_stage', 'Center Stage'],
  ['curtain_up', 'Curtain Up'],
  ['comedy_on_stage', 'Comedy on Stage'],
  ['live_in_concert', 'Live in Concert'],
  ['behind_the_scenes', 'Behind the Scenes'],
  ['toon_town', 'Toon Town'],
  ['kids_corner', 'Kids Corner'],
  ['teen_vibes', 'Teen Vibes'],
  ['bedtime_stories', 'Bedtime Stories'],
  ['faith_inspiration', 'Faith and Inspiration'],
  ['feel_good', 'Feel-Good Favourites'],
  ['date_night', 'Date Night'],
  ['wild_planet', 'Wild Planet'],
  ['game_day', 'Game Day'],
  ['reality_rush', 'Reality Rush'],
];

export default function Home({ selectedCategory }) {
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
  const rowsByKey = Object.fromEntries((rowsQuery.data?.rows || []).map((r) => [r.key, r.items]));
  const selectedItems = selectedCategory ? rowsByKey[selectedCategory.rowKey] : null;

  useEffect(() => {
    if (selectedCategory) {
      if (selectedItems?.length) setFeatured(selectedItems[0]);
    } else if (heroQuery.data?.featured) {
      setFeatured(heroQuery.data.featured);
    }
  }, [selectedCategory, selectedItems, heroQuery.data]);

  function setTab(next) {
    setParams(next === 'home' ? {} : { tab: next });
  }

  const TAB_LABEL = { home: 'Home', tvshows: 'TV Shows', movies: 'Movies', series: 'Series', swahili: 'Swahili' };
  const orderedRowKeys = selectedCategory
    ? [[selectedCategory.rowKey, selectedCategory.label], ...ROW_KEYS.filter(([k]) => k !== selectedCategory.rowKey)]
    : ROW_KEYS;

  return (
    <>
      <TabsBar active={tab} onChange={setTab} />
      <div className="pt-[calc(120px+env(safe-area-inset-top,0px))]">
        <Hero
          featured={featured}
          strip={selectedCategory ? selectedItems : heroQuery.data?.strip}
          onStripSelect={setFeatured}
          kicker={selectedCategory?.label}
        />
        <ContinueWatchingRow items={cw.data} loading={cw.isLoading} onSeedDemo={cw.seedDemo} />
        <Row title={TAB_LABEL[tab]} items={browseQuery.data?.items} loading={browseQuery.isLoading} />
        {orderedRowKeys.map(([key, label]) => (
          <Row key={key} title={label} items={rowsByKey[key]} loading={rowsQuery.isLoading} lazy />
        ))}
      </div>
    </>
  );
}
