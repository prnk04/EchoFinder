const qs = require("querystring");
const { spotifyAxios, getAppToken } = require("./client");
const api = spotifyAxios();

const crypto = require("crypto");
const { updateOrInsertArtist } = require("../database/dbUtils");
const { parseError } = require("../common/handleError");

function sortByPopularity(tracks) {
  return tracks.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

async function getArtistIdByArtistName_spotify(artist_name) {
  try {
    let q = "artist: " + artist_name;
    let type = "artist";
    let market = "US";
    const safe = { q, type, market };
    let spotify_res = await api.get("/search", { params: safe });

    if (spotify_res?.status == 200) {
      let data = spotify_res?.data?.artists?.items;

      sortedArtists = sortByPopularity(data);

      let modified_artist_name = artist_name?.trim().toLowerCase();

      let artistDetail = data?.find(
        (detail) => detail?.name?.trim().toLowerCase() === modified_artist_name
      );
      return artistDetail;
    }
  } catch (error) {
    console.log(
      "Error in fetching artist details from spotify: ",
      parseError(error)
    );
    return {};
  }
}

function cleanTitle(title) {
  return title
    .toLowerCase()
    .replace(/\s*\(.*?\)/g, "") // remove things in parentheses
    .replace(/\s*-.*/, "") // remove " - something"
    .replace(/\s*!.*/, "")
    .trim();
}

async function spotify_searchSongByArtistAndName(title, artist) {
  let artist_detail_here = new Array();
  try {
    let q = "track:" + title + " artist:" + artist.toString();

    let type = "track,artist";
    let market = "US";
    let limit = 50;

    const safe = { q, type, market, limit };

    let spotify_res = await api.get("/search", { params: safe });

    if (spotify_res?.status == 200) {
      let artist_data = spotify_res?.data?.artists?.items;

      let data = spotify_res?.data?.tracks?.items;

      filteredSongs = new Array();

      data = sortByPopularity(data);

      sanitisedTitle = cleanTitle(title);
      requiredSongs = data.filter((a) => {
        return cleanTitle(a.name) == sanitisedTitle;
      });

      filteredSongs = requiredSongs;

      if (artist.length > 0) {
        let filter_based_on_artist = requiredSongs.filter((a) => {
          let spotifyArtistNames = a.artists.map((a) =>
            a.name.trim().toLowerCase()
          );

          if (spotifyArtistNames.includes(artist.toLowerCase().trim())) {
            return a;
          }
        });

        if (filter_based_on_artist.length > 0) {
          filteredSongs = filter_based_on_artist;
        }
      }

      sortedSongs = sortByPopularity(filteredSongs);

      return sortedSongs[0];
    }
  } catch (error) {
    console.log("error in getting song from spotify: ", parseError(error));
    return null;
  }
}

async function getArtistInfo_spotify(artist_name) {
  let artist_detail_here = new Array();
  try {
    let q = "artist:" + artist_name;

    let type = "artist";
    let market = "US";
    let limit = 50;

    const safe = { q, type, market, limit };
    let spotify_res = await api.get("/search", { params: safe });

    if (spotify_res?.status == 200) {
      let artist_data = spotify_res?.data?.artists?.items;

      if (artist_data) {
        let sortedArtists = sortByPopularity(artist_data);

        let artist = sortedArtists.filter((a) => {
          return (
            a.name.trim().toLowerCase() == artist_name?.trim().toLowerCase()
          );
        });

        let thisArtist = artist[0];

        thisArtist_details = {
          artist_spotify_id: thisArtist?.id,
          name: thisArtist?.name,
          genres: thisArtist?.genres,
          popularity: thisArtist?.popularity,
          image: {
            url: thisArtist?.images[0]?.url,
            height: thisArtist?.images[0]?.height,
            width: thisArtist?.images[0]?.width,
          },
          followers: thisArtist?.followers?.total,
        };

        return thisArtist_details;
      }
    }
    // }
  } catch (error) {
    console.log("error in getting artist from spotify: ", parseError(error));
    return {};
  }
}

const getMultipleArtistsFromSpotify = async (artistList) => {
  let artistData = new Array();
  try {
    let noData = artistList?.filter(
      (a) => !a?.image_spotify?.url || a?.image_spotify?.url == ""
    );

    if (noData.length == 0) {
      return {};
    }
    let ids = new Array();
    noData?.map((a) => {
      if (a?.artist_spotify_id == null || a?.artist_spotify_id == "") {
      } else {
        ids.push(a?.artist_spotify_id);
      }
    });

    ids = ids.toString();

    if (ids.replace(",", "").trim().length == 0) {
      return {};
    }
    ids = ids.trim(",");

    let safe = { ids };
    let spotifyRes = await api.get("/artists", { params: safe });
    if (spotifyRes.status == 200) {
      let artistsData = spotifyRes?.data?.artists;
      for (let artist of artistsData) {
        let formatted = {
          followers: artist?.followers?.total,
          genres: artist?.genres,
          popularity: artist?.popularity,
          artist_spotify_id: artist?.id,
          name: artist?.name,
          image_spotify: {
            url: artist?.images[0]?.url || "",
            height: artist?.images[0]?.height || 300,
            width: artist?.images[0]?.width || 300,
          },
        };
        artistData.push(formatted);
      }
    }
  } catch (error) {
    console.log(
      "Error in getting multiple artists list from spotify: ",
      parseError(error)
    );
  } finally {
    let queryRes = await updateOrInsertArtist(artistData);
    return queryRes;
  }
};

const spotify_getArtistsTopTracks = async (artistId) => {
  try {
    let spotifyRes = await api.get(`/artists/${artistId}/top-tracks?market=US`);
    if (spotifyRes?.status == 200) {
      console.log("spotify data: ", spotifyRes?.data);
      let tracks = spotifyRes?.data?.tracks;

      return { tracks: tracks };
    }
    return [];
  } catch (error) {
    console.log(
      "error in getting artists top tracks from spotify: ",
      parseError(error)
    );
    return [];
  }
};

module.exports = {
  getArtistIdByArtistName_spotify,
  getArtistInfo_spotify,
  spotify_searchSongByArtistAndName,
  getMultipleArtistsFromSpotify,
  spotify_getArtistsTopTracks,
};
