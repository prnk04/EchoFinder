const { Schema, model } = require("mongoose");

const imageSchema = new Schema({
  url: String,
  height: Number,
  width: Number,
});

ArtistDetails = {
  name: { type: String },
  spotify_id: { type: String },
};

const trackDetailsSchema = new Schema({
  song_id: { type: String, required: true },
  all_tags: String,
  artists: { type: [ArtistDetails] },
  //   { type: [ArtistDetails] }, //TODO: add link to artist collection
  duration: Number,
  image: imageSchema,
  lastfm_id: String,
  popularity_score: Number,
  release: String,
  embeddingsStatus: String,
  source: String,
  spotify_id: String,
  spotify_popularity: Number,
  title: String,
  total_listeners_counts: Number,
  total_play_counts: Number,
  type: String,
  wiki_summary: String,
  year: Number,
  rank: { type: Number },
  artistsName: { type: [String] },
  artistRef: [{ type: Schema.Types.ObjectId, ref: "ArtistsDetails" }],
  updatedAt: { type: Date, defualt: Date.now },
  createdAt: { type: Date },
});

trackDetailsSchema.index({ song_id: 1 }, { unique: true });
trackDetailsSchema.index({ title: 1, release: 1 }, { unique: true });

// const TrackDetails = mongoose.model("TrackDetails", trackSchema);
module.exports = model("TrackDetails", trackDetailsSchema);
