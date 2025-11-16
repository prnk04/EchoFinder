const {
  storeUserRecommendations,
  fetchUserRecommendations,
  fetchUserFavoriteArtistsWithTracks,
  fetchUserTrackPref,
  dbLookUpTopTracksCacheMultipleCategories,
} = require("../database/dbUtils");
const { getRecommendedSongs } = require("../fastAPI/service");
const { fetchTopTracksArtist } = require("../lastfm/service");
const {
  handleUserFavArtistsWithNoSongs,
  handleTrack_v1,
} = require("../common/helper");
const { getBillBoardChartsSong } = require("../billboard/service");

/**
 *
 * @param {string | null} user_id
 * @returns recommended songs or empty array
 *
 * This function is used to provide recommended songs to user
 */
async function getRecommendations(user_id) {
  try {
    /**
     * If recs in db and the count > 20: send them as response
     * If recs are not in db:
     * - get users fav artists.
     * - consolidate their ids and check in db if those artists have any song
     * - for each artist, if there are 8+ songs, and at least 20 in total, go ahead with the recommendation
     * - else:
     *   - get billboard goat and trending songs.
     *   - get their details from spotify and lastfm
     *   - store them in db
     *   - send them to user
     *   - meanwhile, call the functionality to fetch songs of these artists
     */

    // first, let's see if there are any recommendations present
    console.log("user id is: ", user_id);
    let userRecommendationsInDB = await fetchUserRecommendations(user_id);
    console.log("user recommendations in db are: ", userRecommendationsInDB);

    if (userRecommendationsInDB && userRecommendationsInDB?.length >= 40) {
      return userRecommendationsInDB;
    }

    // db Responses will tell if we have anything for user
    let dbResponses = await Promise.allSettled([
      fetchUserFavoriteArtistsWithTracks(user_id),
      fetchUserTrackPref(user_id),
    ]);
    console.log(
      "db responses after tryingto see if user has fav artist or pref tracks: ",
      dbResponses
    );

    let dbResCountWithData = dbResponses?.filter(
      (a) => a?.value && a?.value.length > 0
    ).length;
    console.log("count of data from database: ", dbResCountWithData);

    if (dbResCountWithData > 0) {
      const artistAndTrackDetails =
        dbResponses[0]?.status == "fulfilled" ? dbResponses[0]?.value : null;
      const userPrefTrackDetails =
        dbResponses[1]?.status == "fulfilled" ? dbResponses[1]?.value : null;

      console.log("artistAndTrackDetails: ", artistAndTrackDetails);
      console.log("userPrefTrackDetails: ", userPrefTrackDetails);
      /**
       * sample artistAndTrackDetails: {
    _id: new ObjectId('691181cb9de6f020e6c4db93'),
    device_id: 'dev_id_1',
    user_id: 'testUser',
    __v: 0,
    artist_spotify_id: '',
    fav_artist: 'testartist',
    updatedAt: 2025-11-10T04:17:04.341Z,
    matchedTracks: [],
    artistDetails: []
  }
       */

      let count_1 = 0;
      let numArtistsWithTracks = 0;
      artistAndTrackDetails?.map((a) => {
        if (a?.matchedTracks?.length > 0) {
          numArtistsWithTracks += 1;
          count_1 = count_1 + a?.matchedTracks?.length;
        }
      });
      let count2 = userPrefTrackDetails?.length;

      let total = count_1 + count2;

      // now, let's put condition: for 50% of the artists if the count of tracks is more than 20 and total trackCount > number_Arti * 20:  then call rec aPI, else do the processing and send chart data
      let half_artist_count = Math.floor(artistAndTrackDetails?.length / 2);
      let min_songs_reqd = artistAndTrackDetails?.length * 20;

      console.log(
        "min number of artists required to have their songs in db: ",
        half_artist_count
      );
      console.log("min number of songs reqd in db: ", min_songs_reqd);
      console.log("num of artists with tracks present: ", numArtistsWithTracks);

      let artistsWithNoSong = artistAndTrackDetails.filter(
        (a) => a.matchedTracks?.length == 0
      );
      console.log("artists with no song: ", artistsWithNoSong);

      if (
        numArtistsWithTracks >= half_artist_count &&
        count_1 >= min_songs_reqd
      ) {
        let inputToFunc = artistsWithNoSong.flatMap((a) => {
          return { name: a?.fav_artist, spotify_id: a?.artist_spotify_id };
        });
        handleUserFavArtistsWithNoSongs(inputToFunc);

        let rec_songs = await getRecommendedSongs(user_id);
        console.log(
          "rec songs result after calling getRecommendations api: ",
          rec_songs
        );

        if (rec_songs) {
          // once we have these recommendations, let's store them in database
          storeUserRecommendations({ rec_songs, user_id });
          return rec_songs;
        } else {
          console.log(
            "Hey! Seems like I couldn't find rec songs from api; falling back"
          );
          let res = await fallbackRecs();
          return res;
        }
      } else {
        let fallbackRes = await fallbackRecs();
        console.log("returning fallbackRes");

        /**
         *  we anyways don't have enough songs
         * writing new piece of code here: here, if no artist detail and no track: maybe call artisttoptracks
         * if no artist detail but track: then only get artist detail, store it in db,by taking ref of id
         * if artist, but no track: maybe we can reuse getartisttoptracks
         */

        let artistsPresentInDb = artistAndTrackDetails.filter(
          (a) => a?.artistDetails != null
        );
        let artistsAbsentFromDB = artistAndTrackDetails.filter(
          (a) => !a?.artistDetails
        );

        console.log("artists that are in db are: ", artistsPresentInDb);
        console.log("artists that are not in db are: ", artistsAbsentFromDB);

        // I am not gonna look for songs of all artists. As we are looking for recommendations right now, and not top tracks of artists. So, rather.I will look for artists who have less than 30 songs in our db and get tehir track details
        let artistsWithFewSongs = artistAndTrackDetails.filter(
          (a) => a?.matchedTracks.length < 30
        );

        let artistsName = artistsWithFewSongs.flatMap(
          (a) => a?.artistDetails?.name || a?.fav_artist
        );
        console.log("artsist name whose top songs we need: ", artistsName);

        if (!artistsName || artistsName.length == 0) {
          return;
        }

        // chunk these artists name so that we can make parallel calls
        let chunkedArtists = chunkArray(artistsName, 2);

        chunkedArtists?.map((thisChunkOfArtists) => {
          thisChunkOfArtists?.map(async (thisArtist) => {
            fetchTopTracksArtist(thisArtist, (limit = 40))
              .then((lastfm_top_tracks) => {
                console.log("we have top songs for this artist");
                if (
                  lastfm_top_tracks?.track &&
                  lastfm_top_tracks?.track?.length > 0
                ) {
                  let dataForInput = lastfm_top_tracks?.track?.flatMap((a) => {
                    return {
                      song: a?.name,
                      artist: a?.artist?.name,
                      rank: a["@attr"]?.rank,
                    };
                  });
                  handleTrack_v1(dataForInput, thisArtist);
                }
              })
              .catch((errorI) => {
                console.log("Error in fetching top artist tracks: ", errorI);
              });
          });
        });
        return fallbackRes;
      }
    } else {
      console.log("no db response found for the artist on line 290");
      let fallbackRes = await fallbackRecs();

      console.log("returning fallbackRes");
      return fallbackRes;
    }
  } catch (error) {
    console.log("Error in making refommendations: ", error);
    return [];
  }
}

/**
 *
 * @param {*} array
 * @param {*} size : the size of chunk you want
 * @returns array of chunks
 */
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 *
 * @returns billboard goat songs.
 */
const fallbackRecs = async () => {
  // first, check in db if we have the se 2 types of songs

  let trendinsgAndGoatedSongs = await dbLookUpTopTracksCacheMultipleCategories([
    // "hot-100",
    "greatest-hot-100-singles",
  ]);
  console.log("trending and goat: ", trendinsgAndGoatedSongs?.length);

  if (trendinsgAndGoatedSongs?.length < 40) {
    // call billboard to get these data
    const [goatedSongs, trendingSogs] = await Promise.allSettled([
      getBillBoardChartsSong("greatest-hot-100-singles"),
      getBillBoardChartsSong("hot-100"),
    ]);

    if (goatedSongs?.status == "fulfilled" && goatedSongs?.value) {
      trendinsgAndGoatedSongs.push(...goatedSongs?.value?.tracks?.flat());
    }
    if (trendingSogs?.status == "fulfilled" && trendingSogs?.value) {
      trendinsgAndGoatedSongs.push(...trendingSogs?.value?.tracks?.flat());
    }
    let randomRes = new Array();
    for (let i = 0; i <= 3; i++) {
      const randomIndex = Math.floor(
        Math.random() * trendinsgAndGoatedSongs.length
      );
      const randomElement = trendinsgAndGoatedSongs[randomIndex];
      randomRes.push(randomElement);
    }
  }
  return trendinsgAndGoatedSongs;
};

module.exports = { getRecommendations };
