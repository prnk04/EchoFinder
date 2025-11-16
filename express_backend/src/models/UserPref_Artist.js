const { Schema, model } = require("mongoose");

const UserFavArtistsSchema = new Schema({
  user_id: { type: String, required: true },
  device_id: { type: String },
  fav_artist: { type: String, default: "" },
  artist_spotify_id: { type: String, default: "" },
  updatedAt: { type: Date, default: Date.now },
});

UserFavArtistsSchema.index(
  { user_id: 1, fav_artist: 1, artist_spotify_id: 1 },
  {
    unique: true,
  }
);

module.exports = model("UserFavArtists", UserFavArtistsSchema);
