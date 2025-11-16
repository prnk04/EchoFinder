const { fastAPIAxios } = require("./client");
const { parseError } = require("../common/handleError");

const api = fastAPIAxios();

async function updateEmbeddings(trackId) {
  try {
    let apiRes = await api.post("/updateEmbeddings?trackId=" + trackId);
    // console.log("api res: ", apiRes);
  } catch (error) {
    console.log("error in asking fast api to update embedding: ", error);
  }
}

async function getRecommendedSongs(user_id) {
  try {
    let apiRes = await api.get("/user/recommendSongs?userId=" + user_id);

    if (apiRes.status == 200) {
      top_tracks = apiRes.data.top_songs;
      return top_tracks;
    }
    return [];
  } catch (error) {
    console.log(
      "error while getting recommendations from fastapi: ",
      parseError(error)
    );
    return [];
  }
}

module.exports = { updateEmbeddings, getRecommendedSongs };
