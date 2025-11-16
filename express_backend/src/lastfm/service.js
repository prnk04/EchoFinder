const qs = require("querystring");
const crypto = require("crypto");

const { lastfmAxios } = require("./client");
const { parseError } = require("../common/handleError");

const api = lastfmAxios();

async function lastfm_fetchSongInfo(title, artist_name) {
  try {
    method = "track.getInfo";

    track = title;
    artist = artist_name;
    autocorrect = 1;
    api_key = process.env.LAST_FM_API_KEY;
    format = "json";

    safe = null;

    safe = { method, track, artist, autocorrect, api_key, format };

    const api_response = await api.get("", { params: safe });

    if (api_response.status == 200) {
      track = api_response.data?.track;
      return track;
    }
  } catch (error) {
    console.log(
      "error in getting artists top tracks from last fm: ",
      parseError(error)
    );
    return null;
  }
}

async function getArtistInfo(artistName) {
  try {
    method = "artist.getInfo";
    artist = artistName;
    autocorrect = 1;
    api_key = process.env.LAST_FM_API_KEY;
    format = "json";

    safe = null;
    safe = { method, artist, autocorrect, api_key, format };

    const api_response = await api.get("", { params: safe });

    let artist_lastfm_response = {
      artist_name: artistName,
      image: { url: "", height: 0, width: 0 },
      total_listeners: 0,
      total_play_count: 0,
    };

    if (api_response && api_response?.status == 200) {
      let artist = api_response?.data?.artist;

      artist_lastfm_response = {
        artist_name: artist?.name,
        image: artist?.image
          ? { url: artist?.image[0]["#text"], height: 0, width: 0 }
          : { url: "", height: 0, width: 0 },
        total_listeners: artist?.stats?.listeners,
        total_play_count: artist?.stats?.playcount,
      };
    }

    return artist_lastfm_response;
  } catch (error) {
    console.log(
      "Error in getting artist detail from lastfm: ",
      parseError(error)
    );
    throw error;
  }
}

const fetchTopTracksArtist = async (artist, limit) => {
  method = "artist.gettoptracks";
  autocorrect = 1;
  api_key = process.env.LAST_FM_API_KEY;
  format = "json";
  limit = limit || 50;

  artist = artist;
  const params = { method, artist, autocorrect, api_key, format, limit };

  const api_response = await api.get("", { params: params });
  console.log(
    "LAstFM response for top tracks of artists is: ",
    api_response?.status
  );
  if (api_response?.status == 200) {
    if (api_response?.data?.toptracks) {
      return api_response?.data?.toptracks;
    } else {
      return [];
    }
  } else {
    return [];
  }
};

module.exports = {
  getArtistInfo,
  lastfm_fetchSongInfo,
  fetchTopTracksArtist,
};
