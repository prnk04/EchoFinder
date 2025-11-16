const { Schema, model } = require("mongoose");

const UserSongRecommendations = new Schema({
  user_id: { type: String, required: true },
  trackRef: { type: Schema.Types.ObjectId, ref: "TrackDetails" }, // stores _ids of tracks
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: Date.now, expires: 60 * 60 },
});

module.exports = model("UserSongRecommendations", UserSongRecommendations);
