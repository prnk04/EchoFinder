const { Schema, model } = require("mongoose");

const topTracksRefCacheSchema = new Schema({
  category: {
    type: String,
    required: true,
  },
  rank: Number,
  track: { type: Schema.Types.ObjectId, ref: "TrackDetails" },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, expires: 60 * 60 * 24 * 2 },
  createdAt: { type: Date },
});

topTracksRefCacheSchema.index({ category: 1 }, { track: 1 }, { unique: true });

module.exports = model("toptracksrefcaches", topTracksRefCacheSchema);
