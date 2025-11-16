const { Schema, model } = require("mongoose");
const crypto = require("crypto");

const artistSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: { type: String, required: true },
  artist_spotify_id: { type: String, required: false, default: "" },
  popularity: { type: Number },
  genres: [String],
  image_spotify: {
    url: { type: String, default: "" },
    height: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
  },
  followers: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

// Add partial unique indexes
artistSchema.index(
  { artist_spotify_id: 1 },
  { partialFilterExpression: { artist_spotify_id: { $ne: "" } } }
);

module.exports = model("ArtistsDetails", artistSchema);
