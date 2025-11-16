const { getBillBoardChartsSong } = require("../billboard/service");
const {
  fetchUserFavArtistsDetails,
  storeArtistDetails,
  dbLookUpTopTracksCache,
  updateUserSongInteraction,
  dbLookUpArtists,
  getArtistsTracksWithUserScore,
  fetchUserFavSongs,
} = require("../database/dbUtils");
const { getArtistInfo } = require("../lastfm/service");
const { getArtistInfo_spotify } = require("../spotify/service");
const { handleUserFavArtistsPostDBInsertion, parseError } = require("./helper");

async function getTopSongs({ chartName, limit }) {
  try {
    // Step 1: Check the database of top tracks cache if the song is present for hot-100 and also if the cache is valid

    chartName = chartName || "hot-100";
    limit = limit || 30;
    const trendingSongsFromDB = await dbLookUpTopTracksCache(
      "category",
      chartName,
      limit
    );
    if (trendingSongsFromDB && trendingSongsFromDB.length >= 20) {
      return { status: 200, error: false, tracks: trendingSongsFromDB };
    } else {
      let rawTracks = await getBillBoardChartsSong(chartName);
      return { status: 200, error: false, tracks: rawTracks?.tracks };
    }
  } catch (error) {
    console.log(
      "Trending songs have encountered an error: ",
      parseError(error)
    );
    return {
      error: true,
      status: 500,
      message: "some error occurred while fetching trending songs",
    };
  }
}

/**
 *
 * @param {*} artistDataFromDb : list of artists from database
 */

async function getArtistDetails(user_id) {
  try {
    // Step 1: Get the users' fav artists and its details from db
    let res = await fetchUserFavArtistsDetails(user_id);
    console.log("-------------");
    console.log("res from db is: ", res);
    console.log("is: ", !res?.error);
    if (!res?.error) {
      checkAndUpdateArtistDetails(res);

      return res;
    }
    // console.log("liked artists: ", res);

    return { error: true, message: res?.message };
  } catch (error) {
    // console.log("error in get artist details: ", error);
    throw error;
  }
}

async function checkAndUpdateArtistDetails(artistDataFromDb) {
  let liked_artists = new Array();

  let likedArtistDetails = new Array();
  liked_artists = artistDataFromDb?.data;

  let lastfm_api_response;
  let spotify_api_response;

  // now, checking if any artist is missing something. If yes, calling lastfm and spotify to get their details
  for (let artist of liked_artists) {
    let thisArtistDetails;
    if (
      artist?.artist_spotify_id == "" ||
      !artist?.artist_spotify_id ||
      !artist?.image_spotify ||
      !artist?.image_lastfm
    ) {
      // first, lets call lastfm
      lastfm_api_response = await getArtistInfo(artist?.name);

      let artistName = lastfm_api_response?.artist_name
        ? lastfm_api_response?.artist_name
        : artist?.name;

      spotify_api_response = await getArtistInfo_spotify(artistName);

      thisArtistDetails = {
        id: crypto.randomUUID(),
        name: spotify_api_response?.name,
        genres: spotify_api_response?.genres,
        popularity: spotify_api_response?.popularity,
        image_spotify: spotify_api_response?.image,
        followers: spotify_api_response?.followers,
        total_listeners: lastfm_api_response?.listeners
          ? lastfm_api_response?.listeners
          : 0,
        total_play_count: lastfm_api_response?.playcount
          ? lastfm_api_response?.playcount
          : 0,
        image_lastfm: lastfm_api_response?.image,
        artist_lastfm_id: "",
        artist_spotify_id: spotify_api_response?.artist_spotify_id,
      };
    } else {
      thisArtistDetails = {
        id: artist?.id,
        name: artist?.name,
        genres: artist?.genres,
        popularity: artist?.popularity,
        image_spotify: artist?.image_spotify,
        followers: artist?.followers,
        total_listeners: artist?.total_listeners,
        total_play_count: artist?.total_play_count,
        image_lastfm: artist?.image_lastfm,
        artist_lastfm_id: artist?.artist_lastfm_id,
        artist_spotify_id: artist?.artist_spotify_id,
      };
    }

    storeArtistDetails(thisArtistDetails);
    likedArtistDetails.push(thisArtistDetails);
  }
}

/**
 *
 * @param {string} user_id
 * @param {string} song_id
 * @param {number} score
 */

async function storeUserSongInteraction(user_id, song_id, score) {
  try {
    updateUserSongInteraction({ user_id, song_id, score });
  } catch (error) {
    console.log("For data: ", { user_id, song_id, score });
    console.log(
      "handleRequest: storeUserSongInteraction: error: ",
      parseError(error)
    );
  }
}

const handleRequestForArtistSongs = async (
  user_id,
  artist_spotify_id,
  artist_name
) => {
  try {
    let dbRes = await getArtistsTracksWithUserScore(
      user_id,
      artist_name,
      artist_spotify_id
    );

    console.log("db response: ", dbRes);
    if (!dbRes || dbRes?.length < 10) {
      // call lastfm or spotify to get the top tracks of this artist
      let artistFromDb = await dbLookUpArtists([artist_name]);
      let res = await handleUserFavArtistsPostDBInsertion(artistFromDb);
      dbRes = await getArtistsTracksWithUserScore(
        user_id,
        artist_name,
        artist_spotify_id
      );
      return dbRes.slice(0, 25);
      // return [];
    } else {
      return dbRes.slice(0, 25);
    }
  } catch (error) {
    console.log(
      "Error in handling handleRequestForArtistSongs:  ",
      parseError(error)
    );
    return [];
  }
};

const handleRequestForUserFavSongs = async (user_id) => {
  let res = await fetchUserFavSongs(user_id);
  return res;
};

module.exports = {
  getArtistDetails,
  storeUserSongInteraction,
  getTopSongs,
  handleRequestForArtistSongs,
  handleRequestForUserFavSongs,
};
