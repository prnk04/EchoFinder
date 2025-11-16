const express = require("express");
const router = express.Router();

const { getRecommendations } = require("../recommendations/getRecommendations");
const {
  getArtistDetails,
  storeUserSongInteraction,
  getTopSongs,
  handleRequestForArtistSongs,
  handleRequestForUserFavSongs,
} = require("../common/handleRequests");
const { storeUserDetails } = require("../database/dbUtils");
const { findOneTrack, handleTracks_v2 } = require("../common/helper");

const { parseError } = require("../common/handleError");

router.get("/health", async (req, res) => {
  res.status(200).json({ text: "Node server is running" });
});

router.get("/recommender/getRecommendations", async (req, res) => {
  try {
    let user_id = req.query.user_id;
    console.log("+++++++++++++++++++++++++++++++++++++++++++++++");
    console.log("for recommendations:  ", user_id);
    // rec_songs = await getRecommendations(user_id);
    rec_songs = await getRecommendations(user_id);
    console.log("recommendation: ", rec_songs);
    // console.log("temp: ", temp);
    res.status(200).json({ rec_songs: rec_songs });
    console.log("+++++++++++++++++++++++++++++++++++++++++++++++");
  } catch (e) {
    console.log("error in getting recs: ", e);
    res.status(500).json({ "error: ": parseError(e) });
  } finally {
    console.log("I have responded for recommended songs", req.query);
  }
});

router.post("/user/userDetails", async (req, res) => {
  try {
    let userDetails = {
      user_id: req.body.user_id,
      device_id: req.body.device_id,
      fav_artists: req.body.fav_artists,
      fav_genres: req.body.fav_genres,
    };

    let responseOfStoringUser = await storeUserDetails(userDetails);

    console.log("res: ", responseOfStoringUser);
    if (!responseOfStoringUser || !responseOfStoringUser?.error) {
      res.status(200).json({ message: "successful insertion" });
    } else if (responseOfStoringUser?.error) {
      if (responseOfStoringUser?.message?.type == "Type Error") {
        res.status(400).json({
          error: true,
          message: responseOfStoringUser?.message?.message,
        });
      } else {
        res
          .status(500)
          .json({ error: true, message: responseOfStoringUser?.message });
      }
    } else {
      res.json({ text: "wait" });
    }
  } catch (error) {
    console.log("Error in storing user deatils: ", error);
    if (error instanceof TypeError) {
      console.log("it is type error");
      res.status(400).json({ message: "Request malformed" });
    }
  }
});

router.get("/artist/details", async (req, res) => {
  try {
    let user_id = req?.query?.user_id;

    console.log("user id: ", user_id);
    if (!user_id || user_id == "") {
      throw new TypeError("user_id is required");
    }

    // call helper function to handle this one

    let response = await getArtistDetails(user_id);
    if (response?.data) {
      res.status(200).json({ data: response?.data });
    } else {
      res.status(500).json(response?.message);
    }
  } catch (error) {
    console.log("parsed error: ", parseError(error));
    let parsedError = parseError(error);
    if (parsedError?.type && parsedError?.type == "Type Error") {
      res.status(400).json({ message: parsedError?.message });
    } else {
      res.status(500).json({ message: parsedError });
    }
  } finally {
    console.log("I have responded for artist details");
  }
});

router.post("/user/songFeedback", async (req, res) => {
  try {
    let { user_id, song_id, score } = req.body;
    storeUserSongInteraction(user_id, song_id, score);
    res.status(200).json({ text: "fired and forgotten" });
  } catch (error) {
    console.log("Error in storing user and song likeness: ", error);
    res
      .status(500)
      .json({ text: "fired and forgotten", error: parseError(error) });
  }
});

function sortByRank(tracks) {
  return tracks.sort((a, b) => (a.rank || 0) - (b.rank || 0));
}

router.get("/songs/trending", async (req, res) => {
  try {
    let tracks = await getTopSongs({ chartName: "hot-100", limit: 30 });

    if (tracks?.status == 200) {
      let tracksToSend = sortByRank(tracks?.tracks);
      toSend = JSON.stringify({ error: false, trendingSongs: tracksToSend });
      res.status(200).json(toSend);
    } else {
      toSend = JSON.stringify({ error: true, trendingSongs: tracks?.message });
      res.status(tracks?.status).json(toSend);
    }
  } catch (error) {
    console.log("prased error for trending songs: ", parseError(error));
    res.status(500).json({ error: true, message: parseError(error) });
  }
});

router.get("/artist/songs", async (req, res) => {
  try {
    let user_id = req.query.user_id;
    let artist_spotify_id = req.query.artist_spotify_id;
    let artist_name = req.query.artist_name;

    let tracksForArtist = await handleRequestForArtistSongs(
      user_id,
      artist_spotify_id,
      artist_name
    );

    res.status(200).json({ tracks: tracksForArtist });
  } catch (error) {
    console.log("Error in get songs of artists: ", parseError(error));
    res.status(500).json({ error: parseError(error) });
  }
});

router.get("/user/fav_track", async (req, res) => {
  try {
    let userId = req?.query?.user_id;
    console.log("user is: ", userId);
    let response = await handleRequestForUserFavSongs(userId);
    res.status(200).json({ fav_tracks: response });
  } catch (error) {
    console.log("error in fetching user fav tracks: ", parseError(error));
    res.status(500).json({ error: parseError(error) });
  }
});

// for my testing
router.post("/insertSongs", async (req, res) => {
  let songArtistDetail = req.body?.songArtistDetail;
  console.log("det: ", songArtistDetail);

  let response = await handleTracks_v2(
    songArtistDetail,
    "",
    false,
    true,
    true,
    null,
    null
  );
  console.log("res: ", response);

  res.json({ text: "got it" });
});

router.get("/song/findOne", async (req, res) => {
  try {
    findOneTrack(req.query.song_id);
  } catch (error) {
    console.log("erro: ", error);
    res.json({ error: parseError(error) });
  }
});

module.exports = router; // Export the router
