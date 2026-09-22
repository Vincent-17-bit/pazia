import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';

export function useContinueWatching() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['continue-watching'],
    queryFn: () => api.continueWatching().then((r) => r.items),
  });

  async function seedDemo() {
    await api.putProgress({ mediaType: 'movie', tmdbId: 'pazia', position: 1400, duration: 5800 });
    await api.putProgress({ mediaType: 'tv', tmdbId: 'sultana', season: 2, episode: 47, position: 900, duration: 1500 });
    await api.putProgress({ mediaType: 'tv', tmdbId: 'sultana', season: 2, episode: 99, position: 100, duration: 105 });
    queryClient.invalidateQueries({ queryKey: ['continue-watching'] });
  }

  return { ...query, seedDemo };
}
