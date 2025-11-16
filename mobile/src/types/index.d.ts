export type TrackType = {

  title: string;
  artistsName: sting[],
  duration: number,
  image: {
    url: string;
    height: number;
    width: number;
  };
  lastfm_id: string,
  spotify_id: string;
  popularity_score: number;
  release: string;
  song_id: string;
  spotify_popularity: number;
  total_listeners_counts: number;
  total_play_counts: number;
  type: string;
  wiki_summary: string;
  year: number;
  all_tags: string;
  rank?: number;   
  score?:number
};

export type ArtistType = {
  artist_lastfm_id: string;
  artist_spotify_id: string;
  followers: number;
  genres: string[];
  id: string;
  image_lastfm: {
    height: number;
    url: string;
    width: number;
  };
  image_spotify: {
    height: number;
    url: string;
    width: number;
  };
  name: string;
  popularity: number;
};
