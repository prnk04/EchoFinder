const crypto = require("crypto");
const {
  lastfm_fetchSongInfo,
  fetchTopTracksArtist,
} = require("../lastfm/service");
const {
  spotify_searchSongByArtistAndName,
  getMultipleArtistsFromSpotify,
  getArtistIdByArtistName_spotify,
  spotify_getArtistsTopTracks,
} = require("../spotify/service");
const {
  bulkUpdateArtistDetails,
  bulkUpdateTrackDetails,
  getTrackDetail,
  bulkUpdateTracksCacheRef,
  dbLookUpTopTracksCache,
  getTrackDetailsForArtist,
  findTracksWithArtistAndSongName,
} = require("../database/dbUtils");

const { parseError } = require("../common/handleError");

const stringSimilarity = require("string-similarity");

function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

function mergeResults(lastfmResult, spotifyResult, baseSong, type) {
  try {
    const lastfmData =
      lastfmResult.status === "fulfilled" ? lastfmResult.value : null;
    const spotifyData =
      spotifyResult.status === "fulfilled" ? spotifyResult.value : null;

    // Generate a unique internal ID (only if both services fail)
    const fallbackId = `${baseSong.title}-${baseSong.artist}`.toLowerCase();

    let source1 = new Array();
    if (lastfmData) {
      source1.push("lastfm");
    }
    if (spotifyResult) {
      source1.push("spotify");
    }

    let source = source1.join(", ");

    let artist_name_spotify;
    let artist_details_fromSpotify;

    if (spotifyData) {
      artist_name_spotify = spotifyData["artists"]?.map((a) => {
        return a.name;
      });

      artist_details_fromSpotify = spotifyData["artists"]?.map((a) => {
        return { name: a.name, spotify_id: a.id };
      });
    }

    let artist_details_from_lastfm = [
      {
        name: lastfmData?.artist?.name,
        spotify_id: "",
      },
    ];

    let lastFMImageURL;
    lastFMImageURL = lastfmData?.image ? lastfmData?.image[0]?.["#text"] : null;

    let trackToReturn = {
      title: spotifyData?.name || lastfmData?.name || baseSong.title,
      artistsName:
        artist_name_spotify || [lastfmData?.artist?.name] || baseSong.artist,
      duration:
        spotifyData?.duration_ms / 1000 || lastfmData?.duration / 1000 || 0,
      image: {
        url: spotifyData?.album?.images[0]?.url || lastFMImageURL || "",
        height: spotifyData?.album?.images[0]?.height || 300,
        width: spotifyData?.album?.images[0]?.width || 300,
      },
      lastfm_id: lastfmData?.mbid || null,
      spotify_id: spotifyData?.id || null,
      popularity_score: 0,
      release: spotifyData?.album?.name || lastfmData?.album?.name || "",
      song_id: spotifyData?.id || fallbackId, // Prevents duplicate entries
      spotify_popularity: spotifyData?.popularity || 0,
      total_listeners_counts: lastfmData?.listeners || 0,
      total_play_counts: lastfmData?.playcount || 0,
      wiki_summary: lastfmData?.wiki?.summary || "",
      year: spotifyData?.album?.release_date?.split("-")[0] || null,
      all_tags:
        lastfmData?.toptags?.tags?.map((tag) => tag.name).toString() || "",
      source: source,
      embeddingsStatus: "pending",
      artists: artist_details_fromSpotify || artist_details_from_lastfm,
      rank: baseSong.rank,
    };

    return trackToReturn;
  } catch (error) {
    console.log("Error in merging: ", parseError(error));
  }
}

function mergeResults_withIds(lastfmResult, spotifyResult, baseSong, trackId) {
  try {
    // Extract the fulfilled values safely (if Promise.allSettled was used)

    const lastfmData =
      lastfmResult.status === "fulfilled" ? lastfmResult.value : null;
    const spotifyData =
      spotifyResult.status === "fulfilled" ? spotifyResult.value : null;

    let source1 = new Array();
    if (lastfmData) {
      source1.push("lastfm");
    }
    if (spotifyData) {
      source1.push("spotify");
    }

    let source = source1.join(", ");

    let artist_name_spotify;
    let artist_details_fromSpotify;

    if (spotifyData) {
      artist_name_spotify = spotifyData["artists"]?.map((a) => {
        return a.name;
      });

      artist_details_fromSpotify = spotifyData["artists"]?.map((a) => {
        return { name: a.name, spotify_id: a.id };
      });
    }

    let artist_details_from_lastfm = [
      {
        name: lastfmData?.artist?.name,
        spotify_id: "",
      },
    ];

    let trackToReturn = {
      title: spotifyData?.name || lastfmData?.name || baseSong.title,
      artistsName:
        artist_name_spotify || [lastfmData?.artist?.name] || baseSong.artist,
      duration:
        spotifyData?.duration_ms / 1000 || lastfmData?.duration / 1000 || 0,
      image: {
        url:
          spotifyData?.album?.images[0]?.url ||
          lastfmData?.album?.image[0]?.["#text"] ||
          "",
        height: spotifyData?.album?.images[0]?.height || 300,
        width: spotifyData?.album?.images[0]?.width || 300,
      },
      lastfm_id: lastfmData?.mbid || null,
      spotify_id: spotifyData?.id || "",
      popularity_score: 0,
      release: spotifyData?.album?.name || lastfmData?.album?.name || "",
      song_id: spotifyData?.id || trackId, // Prevents duplicate entries
      spotify_popularity: spotifyData?.popularity || 0,
      total_listeners_counts: lastfmData?.listeners || 0,
      total_play_counts: lastfmData?.playcount || 0,
      wiki_summary: lastfmData?.wiki?.summary || "",
      year: spotifyData?.album?.release_date?.split("-")[0] || null,
      all_tags:
        lastfmData?.toptags?.tags?.map((tag) => tag.name).toString() || "",
      source: source,
      embeddingsStatus: "pending",
      artists: artist_details_fromSpotify || artist_details_from_lastfm,
      rank: baseSong.rank || 0,
      previousMongoId: trackId,
    };

    return trackToReturn;
  } catch (error) {
    console.log("Error in merging with ids: ", parseError(error));
  }
}

async function handleTrack_v1(billboardData, type) {
  let finalData = new Array();
  try {
    // before calling APIs, see if we have their values in db

    let dbResultsForThisChunk = "";
    let songsWithData = new Array();
    let responseFromDbForSongs = await findTracksWithArtistAndSongName(
      billboardData
    );
    console.log(
      "we may havefound songs with data: ",
      responseFromDbForSongs.length
    );
    console.log("From charts, we have: ", billboardData.length);
    let songsWithoutData = new Array();

    songsWithData = responseFromDbForSongs.filter((a) => a?.songData);

    songsWithoutData = responseFromDbForSongs.filter((a) => !a?.songData);

    console.log("songs with data: ", songsWithData.length);
    console.log("songs without data: ", songsWithoutData.length);

    // store sogs that have data in cache
    try {
      let cacheData = new Array();

      for (let d of songsWithData) {
        // console.log("d is: ", d)
        let thisData = {
          category: type,
          rank: d?.rank,
          track: d?.songData?._id,
        };
        cacheData.push(thisData);
      }

      console.log(
        "for songs for which we have data, I am preparing cache so that they can be stored in db"
      );
      console.log("data for cache: ", cacheData.length);
      bulkUpdateTracksCacheRef(cacheData);
    } catch (error) {
      console.log("error in storing existing ones in db: ", parseError(error));
    }

    const chunks = chunkArray(songsWithoutData, 5);

    for (const chunk of chunks) {
      let thisChunkData = new Array();
      await Promise.allSettled(
        chunk.map(async (song) => {
          const [lastfmResult, spotifyResult] = await Promise.allSettled([
            lastfm_fetchSongInfo(
              song.song,
              song.artist?.split(":")[0].toString()
            ),
            spotify_searchSongByArtistAndName(
              song.song,
              song.artist?.split(":")[0].toString()
            ),
          ]);
          const mergedTrack = mergeResults(
            lastfmResult,
            spotifyResult,
            song,
            type
          );
          thisChunkData.push(mergedTrack);
        })
      );

      finalData.push(thisChunkData);

      // now, I will try to add these artist details in db: get their ids, and replace the artist detail with the mongo id, but this should happen in fire and forget sense

      let artistsToStore = new Array();

      for (let track of thisChunkData) {
        if (!track) {
          continue;
        }
        for (let artist of track?.artists) {
          let artistHere = {
            name: artist?.name,
            artist_spotify_id: artist?.spotify_id,
          };
          if (
            artistsToStore?.find(
              (a) => a?.name == artistHere["name"] && a?.spotify_id != ""
            )
          ) {
            continue;
          }
          artistsToStore.push(artistHere);
        }
      }

      insertOrUpdateArtistAndTracks(artistsToStore, thisChunkData, true, type);
    }

    return finalData.flat();
  } catch (error) {
    console.log("Error in handling tracks: ", parseError(error));
    return finalData.flat();
  }
}

const insertOrUpdateArtistAndTracks = (
  artistDetails,
  trackDetails,
  addToCache,
  cacheType,
  i
) => {
  // First, I am going to store this artist in db so that I can get its reference. Then am I going to look for more details of this artist

  bulkUpdateArtistDetails(artistDetails)
    .then(async (queryRes) => {
      await getMultipleArtistsFromSpotify(queryRes);

      for (let track of trackDetails) {
        let thisArtistRef = new Array();
        for (let artist of track?.artists) {
          let tempRes = queryRes.find(
            (a) =>
              a?.artist_spotify_id == artist?.spotify_id ||
              a?.name?.trim().toLowerCase() ==
                artist?.name?.trim().toLowerCase()
          );
          if (tempRes) thisArtistRef.push(tempRes?._id);
        }

        track["artistRef"] = [...new Set(thisArtistRef.flat())];
      }

      bulkUpdateTrackDetails(trackDetails)
        .then((res) => {
          if (addToCache) {
            let cacheData = new Array();
            let dbUpdateRes = res;
            if (dbUpdateRes) {
              for (let d of dbUpdateRes) {
                let thisData = {
                  category: cacheType,
                  rank: d?.rank,
                  track: d._id,
                };
                cacheData.push(thisData);
              }
              bulkUpdateTracksCacheRef(cacheData);
            }
          }
        })
        .catch((err1) => {
          console.log("err1: ", err1);
        });
    })
    .catch((error) => {
      console.log("error in bulk updating artist details: ", parseError(error));
    });
};

const findOneTrack = async (song_id) => {
  try {
    getTrackDetail(song_id);
  } catch (error) {
    console.log("err: ", error);
  }
};

const handleUserFavArtistsPostDBInsertion = async (dbRes) => {
  try {
    // check if these artists have their songs in db

    // first, look at tracks cache
    const artistWithNoSong = new Array();

    let p = 0;
    for (let thisRes of dbRes) {
      let cachedData = await dbLookUpTopTracksCache(
        "category",
        thisRes?.fav_artist || thisRes?.name,
        50
      );
      if (!cachedData || cachedData.length < 20) {
        artistWithNoSong.push(thisRes);
      }
    }

    let artistWithNoSongInTracks = new Array();
    for (let thisArtist of artistWithNoSong) {
      p += 1;

      let resFromTracks = await getTrackDetailsForArtist(
        thisArtist?.fav_artist || thisArtist?.name
      );
      if (!resFromTracks || resFromTracks?.length < 20) {
        artistWithNoSongInTracks.push(thisArtist);
      }
    }

    if (artistWithNoSongInTracks.length == 0) {
      return;
    }

    // first, let's create chunks of these artists

    let chunkedData = chunkArray(artistWithNoSongInTracks, 2);

    for (let chunk of chunkedData) {
      chunk?.map(async (thisChunk) => {
        console.log("chunk: ", thisChunk);
        if (thisChunk) {
          let topTracksRes_lastFM = new Array();
          let topTracksRes_spotify = new Array();
          let thisChunksTempTracks_lastfm = new Array();
          // next, lets get their top tracks from lastfm
          topTracksRes_lastFM = await fetchTopTracksArtist(
            thisChunk?.fav_artist || thisChunk?.name,
            (limit = 50)
          );

          // if this one failed, call spotify

          if (topTracksRes_lastFM?.length < 1) {
            let thisSpotifyId = thisChunk?.artist_spotify_id;
            if (thisSpotifyId == "") {
              let responseFromSpotify = await getArtistIdByArtistName_spotify(
                thisChunk?.fav_artist || thisChunk?.name
              );
              thisSpotifyId = responseFromSpotify?.id;
              console.log("spotify id of artist from spotify: ", thisSpotifyId);
            }
            // now, get top tracks of this artist from spotify
            if (thisSpotifyId && thisSpotifyId != "") {
              topTracksRes_spotify = await spotify_getArtistsTopTracks(
                thisSpotifyId
              );
            }
          }

          // now, for each song that you've got, get their relevant data
          if (topTracksRes_lastFM && topTracksRes_lastFM?.track?.length > 1) {
            thisChunksTempTracks_lastfm = topTracksRes_lastFM?.track?.flatMap(
              (a) => {
                return {
                  song: a.name,
                  artist: a.artist?.name,
                  rank: parseInt(a["@attr"]["rank"]) || 1,
                };
              }
            );
          }

          // modifying this spotify data to fit the artistSongList thing
          let artistSongList = topTracksRes_spotify?.tracks?.flatMap((a, i) => {
            return { song: a?.name, artist: a?.artists[0]?.name, rank: i + 1 };
          });

          let nonDuplicates = new Array();
          let duplicateEntries = new Array();

          thisChunksTempTracks_lastfm?.map((a) => {
            // nonDuplicates.push(a);
            let duplicateFound = 0;
            thisChunksTempTracks_lastfm?.map((b) => {
              let score = stringSimilarity.compareTwoStrings(
                normalizeTitle(a.song),
                normalizeTitle(b.song)
              );
              let included =
                normalizeTitle(a.song).includes(normalizeTitle(b.song)) ||
                normalizeTitle(b.song).includes(normalizeTitle(a.song));

              if (score >= 0.5 && included && a.rank != b.rank) {
                duplicateFound = 1;
                duplicateEntries.push({
                  s1: a.song,
                  s2: b.song,
                  score: score,
                  included: included,
                  r1: a.rank,
                  r2: b.rank,
                  artist: a.artist,
                });
              }
            });

            if (duplicateFound == 0) {
              nonDuplicates.push(a);
            }
          });

          if (duplicateEntries && duplicateEntries?.length > 0) {
            nonDuplicates.push({
              song: duplicateEntries[0].s1,
              artist: thisChunk?.fav_artist,
              rank: duplicateEntries[0].r1,
            });
            duplicateEntries.map((a) => {
              let found = nonDuplicates.find(
                (b) =>
                  (b.song == a.s1 || b.song == a.s2) &&
                  (b.rank == a.r1 || b.rank == a.r2)
              );

              if (found) {
              } else {
                nonDuplicates.push({
                  song: a.s1,
                  artist: thisChunk?.fav_artist || thisChunk?.name,
                  rank: a.r1,
                });
              }
            });
          }

          if (topTracksRes_spotify?.tracks) {
            await handleTracks_v2(
              artistSongList,
              thisChunk?.fav_artist || thisChunk?.name,
              true,
              false,
              true,
              topTracksRes_spotify?.tracks,
              null
            );
          }

          if (thisChunksTempTracks_lastfm) {
            await handleTracks_v2(
              nonDuplicates,
              thisChunk?.fav_artist || thisChunk?.name,
              true,
              true,
              true,
              null,
              null
            );
          }
        }
      });
    }
  } catch (error) {
    console.log("Error in handling user fav artists: ", error);
  }
};

/** For this function, I am only gonna get spotify track details as we will have lastfm track details already with us 
 * Input will look like: 
 *  [
    {
      name: 'song1',
      playcount: '0',
      listeners: '0',
      url: '0',
      streamable: '0',
      artist: [Object],
      image: [Array],
      '@attr': [Object]
    },
  ]
 * */
const fetchOnlyTrackDataFromSpotifyAndLastFM = async (lastfmData, type) => {
  try {
    // we might have to call both lastfm and spotify
    let chunkedSongs = chunkArray(lastfmData, 1);
    chunkedSongs?.map((thisChunk) => {
      thisChunk?.map(async (thisSong) => {
        let name = thisSong?.name;
        let playcount = thisSong?.playcount;
        let listeners = thisSong?.listeners;
        let artists = thisSong?.artist?.name?.toString();

        // now, I am gonna call spotify and lastfm to get this track detail

        const [lastfmResult, spotifyResult] = await Promise.allSettled([
          lastfm_fetchSongInfo(
            thisSong.name,
            thisSong.artist?.name?.split(":")[0].toString()
          ),
          spotify_searchSongByArtistAndName(
            thisSong.name,
            thisSong.artist?.name?.split(":")[0].toString()
          ),
        ]);

        const mergedTrack = mergeResults(
          lastfmResult,
          spotifyResult,
          { song: name, artist: artists, rank: 0 },
          type
        );
      });
    });
  } catch (error) {
    console.log(
      "Error in fetch track data given lastfm data: ",
      parseError(error)
    );
  }
};

/**
 * @param {*} artistSongList : [{song: "song_1", "artist": "artist_1", "rank":1}]
 * @param {*} type : type of chart; will be useful while storing in cache
 * @param {*} storeInCache : flag to set when we want the tracks to be stored in cache as well
 * @param {*} searchFromSpotify : flag to be set to true if we want track data from spotify
 * @param {*} searchFromLastFM  : flag to be set to true if we want track data from LastFM
 * @returns
 */
const handleTracks_v2 = async (
  artistSongList,
  type,
  storeInCache,
  searchFromSpotify,
  searchFromLastFM,
  spotifyData,
  lastFMData
) => {
  let finalData = new Array();
  searchFromSpotify = searchFromSpotify || true;
  storeInCache = storeInCache || true;
  searchFromLastFM = searchFromLastFM || true;

  try {
    // looking in TracksDetails database if any of these tracks exist

    let tracksPresentInTrackDetails = await findTracksWithArtistAndSongName(
      artistSongList
    );

    let existingSongs = new Array();
    let songsWithoutData = new Array();

    existingSongs = tracksPresentInTrackDetails.filter((a) => a?.songData);
    songsWithoutData = tracksPresentInTrackDetails.filter((a) => !a?.songData);

    let dataForCaching = new Array();
    try {
      if (storeInCache) {
        for (let song of existingSongs) {
          let thisData = {
            category: type,
            rank: song?.rank || 0,
            track: song?.songData?._id,
          };
          dataForCaching.push(thisData);
        }
      }
    } catch (error) {
      console.log("Error in creating data for caching: ", parseError(error));
    }

    // Now, for songs for which we do not have data, lets create chunks of them, call spotify, lastfm and perform further processing
    const chunks = chunkArray(artistSongList, 5);
    let i = 0;

    for (const chunk of chunks) {
      let thisChunkData = new Array();
      await Promise.allSettled(
        chunk.map(async (song, i) => {
          let mergedTrack = await fetchTrackDataFromAPIs(
            song,
            searchFromSpotify,
            searchFromLastFM,
            type,
            spotifyData ? spotifyData[i] : null,
            lastFMData ? lastFMData[i] : null
          );

          if (
            !mergedTrack ||
            mergedTrack?.title == null ||
            !mergedTrack?.title
          ) {
            console.log("I am not gonna add this");
          } else {
            thisChunkData.push(mergedTrack);
          }
        })
      );

      // final data at thi spoint will have data for 5 songs
      finalData.push(thisChunkData);

      // now, I will try to add these artist details in db: get their ids, and replace the artist detail with the mongo id, but this should happen in fire and forget sense
      let artistsToStore = new Array();

      for (let track of thisChunkData) {
        if (!track) {
          continue;
        }
        for (let artist of track?.artists) {
          let artistHere = {
            name: artist?.name || null,
            artist_spotify_id: artist?.spotify_id,
          };
          if (!artistHere?.name || artistHere.name == null) {
            continue;
          }
          if (
            artistsToStore?.find(
              (a) => a?.name == artistHere["name"] && a?.spotify_id != ""
            )
          ) {
            continue;
          }
          artistsToStore.push(artistHere);
        }
      }

      insertOrUpdateArtistAndTracks(
        artistsToStore,
        thisChunkData,
        storeInCache,
        type,
        i
      );

      i += 1;
    }

    return finalData.flat();
  } catch (error) {
    console.log("There was an error in handling tracks: ", parseError(error));
    return finalData.flat();
  }
};

const fetchTrackDataFromAPIs = async (
  songArtistList,
  searchSpotify,
  searchLastFm,
  type,
  spotifyData,
  lastFMData
) => {
  try {
    let apiToCall = 1;
    let resultantTrack;
    apiToCall = searchLastFm && searchSpotify ? 1 : searchSpotify ? 2 : 3;
    console.log("apiToCall: ", apiToCall);

    if (apiToCall == 1) {
      const [lastfmResult, spotifyResult] = await Promise.allSettled([
        lastfm_fetchSongInfo(
          songArtistList.song,
          songArtistList.artist?.split(":")[0].toString()
        ),
        spotify_searchSongByArtistAndName(
          songArtistList.song,
          songArtistList.artist?.split(":")[0].toString()
        ),
      ]);

      resultantTrack = mergeResults(
        lastfmResult,
        spotifyResult,
        songArtistList,
        type
      );
    } else if (apiToCall == 2) {
      // call spotify only
      const [spotifyResult] = await Promise.allSettled([
        spotify_searchSongByArtistAndName(
          songArtistList.song,
          songArtistList.artist?.split(":")[0].toString()
        ),
      ]);
      resultantTrack = mergeResults(
        { status: "fulfilled", value: lastFMData },
        spotifyResult,
        songArtistList,
        type
      );
    } else if (apiToCall == 3) {
      // call lastfm only
      const [lastfmResult] = await Promise.allSettled([
        lastfm_fetchSongInfo(
          songArtistList.song,
          songArtistList.artist?.split(":")[0].toString()
        ),
      ]);
      resultantTrack = mergeResults(
        lastfmResult,
        { status: "fulfilled", value: spotifyData },
        songArtistList,
        type
      );
    }
    return resultantTrack;
  } catch (error) {
    console.log("Error in fetching tracks data from APIs: ", parseError(error));
    return {};
  }
};

function normalizeTitle(title) {
  return title
    .replace(/\s*[-–—]?\s*from\s+".*?"$/i, "") // remove ' - From "..."'
    .replace(/\(.*?\)/g, "") // remove parentheses like (Remastered)
    .trim()
    .toLowerCase();
}

const handleUserFavArtistsWithNoSongs = (artistsWithNoSongs) => {
  console.log("My input looks like: ", artistsWithNoSongs);
  // for these, if no spotify id, get spotify id, and then get top tracks, update db, etc. We might have some functionality for that need to look
};
module.exports = {
  parseError,
  handleTrack_v1,
  findOneTrack,
  handleUserFavArtistsPostDBInsertion,
  fetchOnlyTrackDataFromSpotifyAndLastFM,
  handleTracks_v2,
  handleUserFavArtistsWithNoSongs,
};
