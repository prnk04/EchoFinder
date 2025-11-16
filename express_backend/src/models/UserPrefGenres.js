const { Schema, model } = require("mongoose");

const UserFavGenreSchema = new Schema({
  user_id: { type: String, required: true, unique: true },
  device_id: { type: String },
  fav_genres: { type: [String] },
});

module.exports = model("userfavgenre", UserFavGenreSchema);
