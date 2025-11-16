import { useQuery } from "@tanstack/react-query";

import { apiClient } from "../clients";
import { queryKeys } from "../queryKeys";

// This is a function that will make call to backend
const fetchTrendingSongs = async () => {
  const res = await apiClient("/songs/trending", {
    method: "GET",
  });
  if (res?.ok) {
    return res?.data;
  }
};

// This will actually be used in other screens
export const useTrendingSongs = (user_id: string) =>
  useQuery({
    queryKey: [queryKeys.songs.trending, user_id],
    queryFn: fetchTrendingSongs,
    staleTime: 1000 * 60 * 5, // 5 mins caching
    enabled: !!user_id,
    // refetchInterval: 1000 * 60 * 5,
  });


/** Fetch recommended songs for user */

export const useRecommendedSongs = (user_id: string) => 
  useQuery({
    queryKey: [queryKeys.songs.recommended, user_id],
    queryFn: async({queryKey}) => {
      const [, user_id] = queryKey
      
      return apiClient(`/recommender/getRecommendations?user_id=${user_id}`);

    },
    
    enabled: !!user_id,
    // staleTime: 2* 60 * 1000

    // 🚀 Poll ONLY when tracks are empty
    refetchInterval: (query) => {
      const tracks = query.state.data?.data?.rec_songs;

      // no data or empty tracks → keep polling every 10s
      if (!tracks || tracks.length === 0) return 10_000;

      // tracks exist → stop polling
      return false;
    },

    // 🧱 Prevent hydration glitches
    refetchOnMount: false,
    retry: false, // you don’t want immediate hammering retries
  })

export const useFetchArtistSongs = (user_id: string, artist_spotify_id: string, artist_name: string) => 
  useQuery({
    queryKey: [queryKeys.songs.artist_related, user_id, artist_spotify_id, artist_name],
    queryFn: async({queryKey}) => {
      const [, user_id, artist_spotify_id, artist_name] = queryKey
      const res = await apiClient(`/artist/songs?user_id=${user_id}&artist_spotify_id=${artist_spotify_id}&artist_name=${artist_name}`)
      return res

    },
    enabled: !!user_id && !!artist_spotify_id && !!artist_name,
    // staleTime: 5* 60 * 1000
  })

  // user_fav
export const useFetchUserLikedSongs = (user_id: string) => 
  useQuery({
    queryKey: [queryKeys.songs.user_fav, user_id, ],
    queryFn: async({queryKey}) => {
      const [, user_id] = queryKey
      const res = await apiClient(`/user/fav_track?user_id=${user_id}`)
      return res

    },
    enabled: !!user_id ,
    staleTime: 5* 60 * 1000,
    retryOnMount: false,
    refetchOnMount: false,
  })

