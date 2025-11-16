const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const crypto = require("crypto");

const { updateEmbeddings } = require("../fastAPI/service");
const UserFavArtists = require("../models/UserPref_Artist");
const userfavgenre = require("../models/UserPrefGenres");
const { parseError } = require("../common/handleError");
const usersonginteractions = require("../models/UserSongInteraction");
const TopTracksRefCaches = require("../models/TopTracksRefCaches");
const ArtistsDetails = require("../models/ArtistsSchema");
const TrackDetails = require("../models/TracksDetails");
const UserSongRecommendations = require("../models/UserSongRecommendations");
const UserSongInteraction = require("../models/UserSongInteraction");

async function dbLookUpTopTracksCache(field, value, limitHere) {
  try {
    const now = new Date();
    limitHere = limitHere || 30;

    if (field == "category") {
      const agg = [
        {
          $match: {
            $and: [
              {
                category: value,
              },
            ],
          },
        },
        {
          $lookup: {
            from: "trackdetails",
            localField: "track",
            foreignField: "_id",
            as: "trackDetails",
          },
        },
        {
          $unwind: "$trackDetails",
        },
        {
          $lookup: {
            from: "artistsdetails",
            let: {
              artistRefs: "$trackDetails.artistRef",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ["$_id", "$$artistRefs"],
                  },
                },
              },
            ],
            as: "artistDetails",
          },
        },
        {
          $sort: {
            rank: 1,
          },
        },
        {
          $limit: limitHere,
        },
      ];

      const res = await TopTracksRefCaches.aggregate(agg);

      let formattedTrackDetails = new Array();

      for (let track of res) {
        let thisTrack = {
          song_id: track?.trackDetails?.song_id,
          all_tags: track?.trackDetails?.all_tags,

          duration: track?.trackDetails?.duration,
          image: track?.trackDetails?.image,
          lastfm_id: track?.trackDetails?.lastfm_id,
          popularity_score: track?.trackDetails?.popularity_score,
          release: track?.trackDetails?.release,
          spotify_id: track?.trackDetails?.spotify_id,
          spotify_popularity: track?.trackDetails?.spotify_popularity,
          title: track?.trackDetails?.title,
          total_listeners_counts: track?.trackDetails?.total_listeners_counts,
          total_play_counts: track?.trackDetails?.total_play_counts,
          wiki_summary: track?.trackDetails?.wiki_summary,
          year: track?.trackDetails?.year,
          rank: track?.rank,
          artistsName: track?.trackDetails?.artistsName?.toString(),
        };

        formattedTrackDetails.push(thisTrack);
      }
      return formattedTrackDetails;
    }
  } catch (error) {
    console.log("Error in looking for top tracks: ", parseError(error));
    return [];
  }
}

function buildSafeMatchFilter(track) {
  const conditions = [];

  if (track.spotify_id && track.spotify_id.trim() !== "") {
    conditions.push({ spotify_id: track.spotify_id });
  }

  if (track.last_fm_id && track.last_fm_id.trim() !== "") {
    conditions.push({ last_fm_id: track.last_fm_id });
  }

  if (track.song_id && track.song_id.trim() !== "") {
    conditions.push({ song_id: track.song_id });
  }

  // If neither ID is valid, return a filter that will never match anything
  if (conditions.length === 0) {
    // Force insert (will cause upsert to always insert)
    return { _id: new mongoose.Types.ObjectId() }; // Unique dummy _id
  }

  return conditions.length === 1 ? conditions[0] : { $or: conditions };
}

function buildSafeMatchFilterArtist(artist) {
  const conditions = [];

  if (artist.artist_spotify_id && artist.artist_spotify_id.trim() !== "") {
    conditions.push({ artist_spotify_id: artist.artist_spotify_id });
  }

  if (artist.artist_last_fm_id && artist.artist_last_fm_id.trim() !== "") {
    conditions.push({ artist_last_fm_id: artist.artist_last_fm_id });
  }

  // If neither ID is valid, return a filter that will never match anything
  if (conditions.length === 0) {
    // Force insert (will cause upsert to always insert)
    return { _id: new mongoose.Types.ObjectId() }; // Unique dummy _id
  }

  return conditions.length === 1 ? conditions[0] : { $or: conditions };
}

async function storeUserDetails(userDetails) {
  try {
    console.log("fav: ", userDetails);
    let userfavArtistsDetails = new Array();
    let userfavArtistsDetail = {
      user_id: userDetails.user_id,
      device_id: userDetails.device_id,
    };

    let userfavGenresDetails = {
      user_id: userDetails.user_id,
      device_id: userDetails.device_id,
    };

    if (userDetails["fav_artists"] && userDetails["fav_artists"].length > 0) {
      for (let fav_artist of userDetails["fav_artists"]) {
        let fav_artist_spotify_id = await ArtistsDetails.findOne({
          name: fav_artist,
        });

        let spotifyId = "";
        if (fav_artist_spotify_id) {
          spotifyId = fav_artist_spotify_id?.artist_spotify_id;
        }

        userfavArtistsDetails.push({
          user_id: userDetails.user_id,
          device_id: userDetails.device_id,
          fav_artist: fav_artist,
          artist_spotify_id: spotifyId,
        });
      }
    } else {
      userfavArtistsDetails.push(userfavArtistsDetail);
    }

    if (userDetails["fav_genres"]) {
      userfavGenresDetails["fav_genres"] = userDetails["fav_genres"];
    }

    const resOfArtist = await BulkStoreUserFavArtsist(userfavArtistsDetails);
    const resOfGenres = await storeUserFavGenres(userfavGenresDetails);
  } catch (error) {
    return { error: true, message: parseError(error) };
  }
}

async function BulkStoreUserFavArtsist(userfavArtistsDetails) {
  try {
    const operations = userfavArtistsDetails.map((userDetail) => {
      return {
        updateOne: {
          filter: {
            user_id: userDetail.user_id,
            fav_artist: userDetail.fav_artist,
            artist_spotify_id: userDetail.artist_spotify_id,
          },
          update: {
            $setOnInsert: {
              user_id: userDetail.user_id,
              device_id: userDetail.device_id,
              fav_artist: userDetail.fav_artist,
              artist_spotify_id: userDetail.artist_spotify_id,
            },
          },
          upsert: true,
        },
      };
    });

    const res = await UserFavArtists.bulkWrite(operations);
  } catch (error) {
    console.log(
      "error while bulk storing user fav artists: ",
      parseError(error)
    );
  }
}

async function storeUserFavGenres(userfavGenresDetails) {
  try {
    const res = await userfavgenre.findOneAndUpdate(
      (filter = { user_id: userfavGenresDetails.user_id }),
      { $set: userfavGenresDetails },
      { upsert: true }
    );
  } catch (error) {
    console.log("Error in staoring user fav genres: ", parseError(error));
  }
}

async function fetchUserFavArtistsDetails(user_id) {
  try {
    console.log("for fac asrtist: ", user_id);
    let fav_artists = new Array();
    // const agg = [
    //   {
    //     $match: {
    //       user_id: user_id,
    //     },
    //   },
    //   {
    //     $match: {
    //       fav_artist: {
    //         $ne: null,
    //       },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "artistsdetails",
    //       localField: "fav_artist",
    //       foreignField: "name",
    //       as: "artistDetail",
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$artistDetail",
    //       preserveNullAndEmptyArrays: true,
    //     },
    //   },
    //   {
    //     $addFields: {
    //       name: "$artistDetail.name",
    //       genres: "$artistDetail.genres",
    //       popularity: "$artistDetail.popularity",
    //       image_spotify: "$artistDetail.image_spotify",
    //       followers: "$artistDetail.followers",
    //       total_listeners: "$artistDetail.total_listeners",
    //       total_play_count: "$artistDetail.total_play_count",
    //       image_lastfm: "$artistDetail.image_lastfm",
    //       artist_lastfm_id: "$artistDetail.artist_lastfm_id",
    //       artist_spotify_id: "$artistDetail.artist_spotify_id",
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: false,
    //       __v: false,
    //       artistDetail: false,
    //     },
    //   },
    // ];

    const agg = [
      {
        $match: {
          user_id: user_id,
        },
      },
      {
        $match: {
          fav_artist: {
            $ne: null,
          },
        },
      },
      {
        $lookup: {
          from: "artistsdetails",
          let: {
            favArtistName: {
              $trim: {
                input: {
                  $toLower: "$fav_artist",
                },
              },
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    {
                      $trim: {
                        input: {
                          $toLower: "$name",
                        },
                      },
                    },
                    "$$favArtistName",
                  ],
                },
              },
            },
            {
              $sort: {
                popularity: -1,
              },
            },
            {
              $limit: 1,
            },
          ],
          as: "artistDetail",
        },
      },
      {
        $unwind: {
          path: "$artistDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          name: "$artistDetail.name",
          genres: "$artistDetail.genres",
          popularity: "$artistDetail.popularity",
          image_spotify: "$artistDetail.image_spotify",
          followers: "$artistDetail.followers",
          total_listeners: "$artistDetail.total_listeners",
          total_play_count: "$artistDetail.total_play_count",
          image_lastfm: "$artistDetail.image_lastfm",
          artist_lastfm_id: "$artistDetail.artist_lastfm_id",
          artist_spotify_id: "$artistDetail.artist_spotify_id",
        },
      },
      {
        $project: {
          _id: false,
          __v: false,
          artistDetail: false,
        },
      },
    ];

    fav_artists = await UserFavArtists.aggregate(agg);
    console.log("fav_artist: ", fav_artists);

    return { error: false, data: fav_artists };
  } catch (error) {
    console.log("Error in dbutils: ", error);
    console.log("Error while fetching user fav artist: ", parseError(error));
    let errorParsed = parseError(error);
    return { error: true, message: errorParsed };
  }
}

async function storeArtistDetails(artistDetail) {
  try {
    let filter = buildSafeMatchFilterArtist(artistDetail);

    let res = await ArtistsDetails.findOneAndUpdate(
      filter,
      {
        $set: {
          id: crypto.randomUUID(),
          name: artistDetail?.name,
          genres: artistDetail?.genres,
          popularity: artistDetail?.popularity,
          image_spotify: artistDetail?.image,
          followers: artistDetail?.followers,
          total_listeners: artistDetail.tital_listeners,
          total_play_count: artistDetail.total_play_counts,
          image_lastfm: artistDetail?.image_lastfm,
          artist_lastfm_id: artistDetail?.artist_lastfm_id,
          artist_spotify_id: artistDetail?.artist_spotify_id,
          updatedAt: Date.now(),
        },
      },
      { upsert: true }
    );
    // console.l;
  } catch (error) {
    console.log("Error in storing artist detail: ", parseError(error));
  }
}

async function updateUserSongInteraction(data) {
  let res = await usersonginteractions.updateOne(
    { $and: [{ user_id: data.user_id }, { song_id: data.song_id }] },
    {
      $set: { user_id: data.user_id, song_id: data.song_id, score: data.score },
    },
    { upsert: true }
  );
  if (res.modifiedCount > 0 || res.upsertedCount > 0) {
    console.log("stored preference for ", data);
  }
  return res;
}

const bulkUpdateArtistDetails = async (artistDetail) => {
  let updateRes = new Array();

  try {
    for (let artist of artistDetail) {
      let detailForInsertion = { ...artist };
      detailForInsertion.id = crypto.randomUUID();

      const updateOps = {
        $set: {},
        $setOnInsert: detailForInsertion,
      };

      if (!artist.artist_spotify_id) {
        // no valid spotify id to update
      } else {
        updateOps.$set.artist_spotify_id = artist.artist_spotify_id;
        // remove duplicate field to avoid conflict
        delete updateOps.$setOnInsert.artist_spotify_id;
      }

      let newArtistDetail = artist;
      let sid = artist?.spotify_id || artist?.artist_spotify_id;
      let nameHere = artist?.name;

      const res = await ArtistsDetails.findOneAndUpdate(
        { $or: [{ artist_spotify_id: sid }, { name: nameHere }] },
        updateOps,
        {
          new: true, // return the *updated* (or newly inserted) document
          upsert: true, // create if not exists
          setDefaultsOnInsert: true,
        }
      );
      updateRes.push(res);
    }
    // console.log("updated res: ", updateRes);
    return updateRes;
  } catch (error) {
    console.log("error in bulk updating artist details: ", parseError(error));
    return updateRes;
  }
};

const bulkUpdateTrackDetails = async (trackData) => {
  let allIds = new Array();
  try {
    for (let track of trackData) {
      if (!track?.title || track?.title == null) {
        return;
      }
      const updateOps = {
        $set: {},
        $setOnInsert: { ...track },
      };

      for (let field in track) {
        if (field == "id") {
          continue;
        }
        if (track[field] == null || track[field] == "") {
        } else {
          updateOps.$set[field] = track[field];
          delete updateOps.$setOnInsert[field];
        }
      }

      updateOps.$setOnInsert.createdAt = Date.now();
      updateOps.$set.updatedAt = Date.now();

      const res = await TrackDetails.findOneAndUpdate(
        { song_id: track?.song_id },

        updateOps,

        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        }
      );
      updateEmbeddings(track?.song_id);
      allIds.push(res);
    }

    return allIds;
  } catch (error) {
    console.log("error in bulk updating track data: ", parseError(error));
    return allIds;
  }
};

const getTrackDetail = async (song_id) => {
  try {
    let trackDetail = await TrackDetails.findOne({ song_id: song_id }).populate(
      "artistRef"
    );
    console.log("trackl det: ", trackDetail);
  } catch (error) {
    console.log("error in finding track: ", error);
  }
};

/**
 * 
 * @param {*} details : : [
   {
     user_id: 'user1',
     device_id: 'dev_id_2',
     fav_artist: 'artist_1',
     artist_spotify_id: ''
   },
   
 ]
 * @returns : void
 */
const storeFavArtists = async (details) => {
  try {
    for (let detail of details) {
      let artist;
      try {
        let detailForInsertion = { ...detail };
        detailForInsertion.id = crypto.randomUUID();

        const updateOps = {
          $set: {},
          $setOnInsert: detailForInsertion,
        };

        // Only update if artist_spotify_id is missing or empty
        if (!detail.artist_spotify_id) {
          // no valid spotify id to update
        } else {
          updateOps.$set.artist_spotify_id = detail.artist_spotify_id;
          // remove duplicate field to avoid conflict
          delete updateOps.$setOnInsert.artist_spotify_id;
        }
        let res = await UserFavArtists.findOneAndUpdate(
          {
            user_id: detail.user_id,
            device_id: detail.device_id,
            fav_artist: {
              $regex: new RegExp(`^${detail.fav_artist.trim()}$`, "i"),
            },
            $or: [
              { artist_spotify_id: { $exists: false } },
              { artist_spotify_id: "" },
              { artist_spotify_id: null },
            ],
          },
          updateOps,
          {
            upsert: true,
            returnDocument: "after",
          }
        );
        // console.log("res is: ", res);
      } catch (error) {
        if (error.code == 11000) {
          console.log("Duplicate key error. Let it be.");
          return;
        }
        console.log(
          "error in updating or inserting artist in user fav artist is: ",
          error
        );
      }
    }
  } catch (error) {
    console.log("Error in storing fav artists: ", parseError(error));
  }
};

const dbLookUpArtists = async (artists) => {
  try {
    let conditions = new Array();
    for (let artist of artists) {
      conditions.push({ $regex: new RegExp(artist.trim(), "i") });
    }

    const query = {
      name: {
        $in: artists.map(
          (p) => new RegExp(`^${p.trim()}$`, "i") // exact, case-insensitive match
        ),
      },
    };

    // have and condition and 2 queries here: 1 will be for the case when there's no spotify id, other for when there's spotify id

    let dbResponse = await ArtistsDetails.find(query).lean();
    return dbResponse;
  } catch (error) {
    console.log("error in finding artists: ", parseError(error));
    return [];
  }
};

const storeUserRecommendations = async (dataHere) => {
  try {
    let rec_songs = dataHere?.rec_songs;
    let user_id = dataHere?.user_id;
    let recData = new Array();
    rec_songs.map((a) => {
      recData.push({
        user_id: user_id,
        trackRef: ObjectId.createFromHexString(a?._id),
      });
    });

    let operation = recData.map((a) => {
      return {
        updateOne: {
          filter: { $and: [{ user_id: a.user_id }, { trackRef: a.trackRef }] },
          update: {
            $setOnInsert: {
              user_id: a.user_id,
              trackRef: a.trackRef,
              expiresAt: new Date(Date.now() + 1000 * 1 * 3600),
            },
          },
          upsert: true,
        },
      };
    });
    UserSongRecommendations.bulkWrite(operation);
  } catch (error) {
    console.log("Error in storing suer song rec: ", parseError(error));
  }
};

const fetchUserRecommendations = async (user_id) => {
  try {
    let recs = await UserSongRecommendations.find(
      { user_id: user_id },
      (projection = { _id: false, user_id: false })
    )
      .populate("trackRef")
      .lean();
    modifiedRes = new Array();
    if (recs?.length > 0) {
      recs.map((a) => {
        modifiedRes.push(a.trackRef);
      });
    }
    return modifiedRes;
  } catch (error) {
    console.log("Error in fetching user recs: ", parseError(error));
    return [];
  }
};

const getTracksWithoutDetails = async () => {
  let res = await TrackDetails.find({ spotify_id: { $eq: "" } })
    .populate("artistRef")
    .lean();
  return res;
};

const getTrackDetailsForArtist = async (artists_name) => {
  let res = await TrackDetails.find({ "artists.name": artists_name })
    .populate("artistRef")
    .lean();
  return res;
};

const fetchUserFavoriteArtistsWithTracks = async (user_id) => {
  const agg = [
    {
      $match: {
        user_id: user_id,
        fav_artist: { $ne: null },
      },
    },
    {
      $lookup: {
        from: "trackdetails",
        let: {
          favSpotifyId: "$artist_spotify_id",
          favArtistName: {
            $trim: { input: { $toLower: "$fav_artist" } },
          },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  // Case 1: Match using Spotify ID
                  {
                    $and: [
                      { $ne: ["$$favSpotifyId", null] },
                      { $ne: ["$$favSpotifyId", ""] },
                      { $in: ["$$favSpotifyId", "$artists.spotify_id"] },
                    ],
                  },
                  // Case 2: Match using artist name (case-insensitive, trimmed)
                  {
                    $and: [
                      {
                        $or: [
                          { $eq: ["$$favSpotifyId", null] },
                          { $eq: ["$$favSpotifyId", ""] },
                        ],
                      },
                      {
                        $in: [
                          "$$favArtistName",
                          {
                            $map: {
                              input: "$artists.name",
                              as: "n",
                              in: { $trim: { input: { $toLower: "$$n" } } },
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
          // Only keep relevant fields
          {
            $project: {
              title: 1,
              artists: 1,
              album: 1,
              song_id: 1,
            },
          },
        ],
        as: "matchedTracks",
      },
    },
    // Second lookup for artist details at root level (not nested inside matchedTracks)
    {
      $lookup: {
        from: "artistsdetails",
        let: {
          favSpotifyId: "$artist_spotify_id",
          favArtistName: {
            $trim: { input: { $toLower: "$fav_artist" } },
          },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  // Match by Spotify ID
                  {
                    $and: [
                      { $ne: ["$$favSpotifyId", null] },
                      { $ne: ["$$favSpotifyId", ""] },
                      {
                        $eq: [
                          { $toLower: "$artist_spotify_id" },
                          { $toLower: "$$favSpotifyId" },
                        ],
                      },
                    ],
                  },
                  // Match by name
                  {
                    $and: [
                      // {
                      //   $or: [
                      //     { $eq: ["$$favSpotifyId", null] },
                      //     { $eq: ["$$favSpotifyId", ""] },
                      //   ],
                      // },
                      {
                        $eq: [
                          { $trim: { input: { $toLower: "$name" } } },
                          "$$favArtistName",
                        ],
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: "artistDetails",
      },
    },
    { $unwind: { path: "$artistDetails", preserveNullAndEmptyArrays: true } },
  ];

  let res = await UserFavArtists.aggregate(agg);
  return res;
};

const fetchUserTrackPref = async (user_id) => {
  const agg = [
    {
      $match: {
        user_id: user_id,
      },
    },
    {
      $lookup: {
        from: "trackdetails",
        localField: "song_id",
        foreignField: "song_id",
        as: "trackDetails",
      },
    },
  ];

  let res = await UserSongInteraction.aggregate(agg);
  return res;
};

const updateOrInsertArtist = async (artistDetail) => {
  let collectiveResponse = new Array();
  try {
    for (let detail of artistDetail) {
      let artist;
      try {
        let sid = detail?.spotify_id || detail?.artist_spotify_id;
        let nameHere = detail?.name;
        artist = await ArtistsDetails.findOneAndUpdate(
          {
            $or: [{ artist_spotify_id: sid }, { name: nameHere }],
          },
          {
            $set: detail,
            $currentDate: { updatedAt: true },
          },
          {
            $setOnInsert: {
              id: crypto.randomUUID(), // only added when a new doc is inserted
            },
          },
          {
            new: true,
            setDefaultsOnInsert: true,
            includeResultMetadata: true,
            returnDocument: true,
          }
        );
      } catch (error) {
        console.log("error in creating artist: ", parseError(error));
        if (error.code == 11000) {
        }
        console.log("is artist here on create or update ?: ", artist);
      }
      try {
        if (!artist?.value && !artist?._id) {
          console.log(
            "artist is not there: creating here on create or update "
          );

          let p = detail;
          p["id"] = crypto.randomUUID();
          artist = await ArtistsDetails.create(p);
        }
      } catch (error) {
        console.log("Second time error in create artist: ", parseError(error));
      }

      collectiveResponse.push(artist?.value || artist);
    }
    return collectiveResponse;
  } catch (error) {
    console.log("Error in updating or inserting artists: ", parseError(error));
    return collectiveResponse;
  }
};

async function dbLookUpTopTracksCacheMultipleCategories(categories) {
  try {
    const agg = [
      {
        $match: {
          category: { $in: categories },
        },
      },
      {
        $lookup: {
          from: "trackdetails",
          localField: "track",
          foreignField: "_id",
          as: "trackDetails",
        },
      },
      {
        $unwind: "$trackDetails",
      },
      {
        $lookup: {
          from: "artistsdetails",
          let: {
            artistRefs: "$trackDetails.artistRef",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$artistRefs"],
                },
              },
            },
          ],
          as: "artistDetails",
        },
      },
      {
        $sort: {
          rank: 1,
        },
      },
    ];

    const res = await TopTracksRefCaches.aggregate(agg);

    let formattedTrackDetails = new Array();

    for (let track of res) {
      let thisTrack = {
        song_id: track?.trackDetails?.song_id,
        all_tags: track?.trackDetails?.all_tags,

        duration: track?.trackDetails?.duration,
        image: track?.trackDetails?.image,
        lastfm_id: track?.trackDetails?.lastfm_id,
        popularity_score: track?.trackDetails?.popularity_score,
        release: track?.trackDetails?.release,
        spotify_id: track?.trackDetails?.spotify_id,
        spotify_popularity: track?.trackDetails?.spotify_popularity,
        title: track?.trackDetails?.title,
        total_listeners_counts: track?.trackDetails?.total_listeners_counts,
        total_play_counts: track?.trackDetails?.total_play_counts,
        wiki_summary: track?.trackDetails?.wiki_summary,
        year: track?.trackDetails?.year,
        rank: track?.rank,
        artistsName: track?.trackDetails?.artistsName?.toString(),
      };

      formattedTrackDetails.push(thisTrack);
    }
    return formattedTrackDetails;
  } catch (error) {
    console.log(
      "Error in looking for tracks cache for multiple categories: ",
      parseError(error)
    );
    return [];
  }
}

const findTracksWithArtistAndSongName = async (artistAndSongList) => {
  try {
    const oldest = Date.now() - 60 * 60 * 1000 * 24 * 7;

    let songsForThis = new Array();
    for (let a of artistAndSongList) {
      let res = await TrackDetails.findOne({
        $and: [
          { "artists.name": a?.artist?.split(":")[0]?.trim(), title: a?.song },
          { updatedAt: { $gt: oldest } },
        ],
      }).lean();

      songsForThis.push({
        song: a?.song,
        artist: a?.artist,
        rank: a?.rank,
        songData: res,
      });
    }

    return songsForThis;
  } catch (error) {
    console.log("Error in finding tracks in db: ", error);
    return null;
  }
};

const getArtistsTracksWithUserScore = async (
  user_id,
  artist_name,
  artist_spotify_id
) => {
  try {
    const agg = [
      {
        $match: {
          "artists.spotify_id": artist_spotify_id,
        },
      },
      {
        $lookup: {
          from: "usersonginteractions",
          let: {
            trackSongId: "$song_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$song_id", "$$trackSongId"],
                    },
                    {
                      $eq: ["$user_id", user_id],
                    },
                  ],
                },
              },
            },
          ],
          as: "userLike",
        },
      },
      {
        $addFields: {
          userScore: {
            $ifNull: [
              {
                $arrayElemAt: ["$userLike.score", 0],
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          userLike: 0,
        },
      },
    ];

    let tracksWithUserScore = await TrackDetails.aggregate(agg);
    return tracksWithUserScore;
  } catch (error) {
    console.log(
      "Error in fetching tracks of artists along with their scores: ",
      parseError(error)
    );
    return [];
  }
};

const fetchUserFavSongs = async (user_id) => {
  try {
    const agg = [
      {
        $match: {
          $and: [
            {
              user_id: user_id,
            },
            // {
            //   score: {
            //     $gt: 0,
            //   },
            // },
          ],
        },
      },
      {
        $lookup: {
          from: "trackdetails",
          localField: "song_id",
          foreignField: "song_id",
          as: "trackDetails",
        },
      },
      {
        $unwind: {
          path: "$trackDetails",
        },
      },
      {
        $project: {
          song_id: 0,
          user_id: 0,
          _id: 0,
        },
      },
    ];
    let userfav_songs = await usersonginteractions.aggregate(agg);
    if (userfav_songs) {
      let updatedList = new Array();
      userfav_songs?.map((a) => {
        let thisData = { ...a?.trackDetails };
        thisData["score"] = a?.score;
        updatedList.push(thisData);
      });

      return updatedList;
    }
  } catch (error) {
    console.log("Error in fetching users fav: ", parseError(error));
    return [];
  }
};

const bulkUpdateTracksCacheRef = async (trackDetails) => {
  try {
    // console.log("category: ", )

    let op = trackDetails?.map((track) => {
      // console.log("category: ", track?.category);
      let expiresAt = new Date(Date.now() + 60 * 60 * 24 * 2 * 1000);
      if (track.category?.trim()?.toLowerCase() != "hot-100") {
        expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000);
      }
      return {
        updateOne: {
          filter: {
            $and: [{ rank: track?.rank }, { category: track?.category }],
          },
          update: {
            $set: {
              rank: track?.rank,
              category: track?.category,
              track: track?.track,
              expiresAt: expiresAt,
            },
          },

          upsert: true,
        },
      };
    });
    const res = await TopTracksRefCaches.bulkWrite(op);
    // console.log("Result of bulk storing in cache: ", res);
  } catch (error) {
    console.log("error in putting in db: ", error);
  }
};

module.exports = {
  storeUserDetails,
  fetchUserFavArtistsDetails,
  storeArtistDetails,
  dbLookUpTopTracksCache,
  updateUserSongInteraction,
  bulkUpdateArtistDetails,
  bulkUpdateTrackDetails,
  getTrackDetail,
  storeFavArtists,
  dbLookUpArtists,
  storeUserRecommendations,
  fetchUserRecommendations,
  getTracksWithoutDetails,
  fetchUserFavoriteArtistsWithTracks,
  fetchUserTrackPref,
  updateOrInsertArtist,
  getTrackDetailsForArtist,
  dbLookUpTopTracksCacheMultipleCategories,
  findTracksWithArtistAndSongName,
  getArtistsTracksWithUserScore,
  fetchUserFavSongs,
  bulkUpdateTracksCacheRef,
};
