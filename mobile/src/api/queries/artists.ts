import { useQuery } from "@tanstack/react-query";

import { apiClient } from "../clients";
import { queryKeys } from "../queryKeys";



// This will actually be used in other screens
export const useFetchArtist = (user_id: string) =>
  useQuery({
    queryKey: [queryKeys.artists.detail, user_id],
    // queryFn: fetchArtist,
    queryFn: async ({ queryKey }) => {
      const [, user_id] = queryKey;
      const params = new URLSearchParams();
      let uid = user_id ? user_id.toString() : "";
      params.append("user_id", uid);
      const res = await apiClient(`/artist/details?${params}`);
      return res?.data;
    },
    
    // staleTime: 1000 * 60 * 5, // 5 mins caching
    // refetchInterval: 1000 * 60 * 5,
    enabled: !!user_id,

     refetchInterval: (query) => {
      const artists = query.state.data?.data;

      // no data or empty tracks → keep polling every 10s
      if (!artists || artists.length === 0 || !artists?.artist_spotify_id) return 10_000;

      // tracks exist → stop polling
      return false;
    },

    // 🧱 Prevent hydration glitches
    refetchOnMount: false,
    retry: false,
  });
