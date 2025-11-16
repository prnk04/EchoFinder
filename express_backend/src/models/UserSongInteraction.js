const { Schema, model } = require("mongoose");

const userSongInteractionSchema = new Schema({
  user_id: { type: String, required: true },
  song_id: { type: String, required: true },
  score: { type: Number, default: 0, required: true },
  updatedAt: { type: Date, default: Date.now },
});

userSongInteractionSchema.index(
  { user_id: 1, song_id: 1 },
  {
    unique: true,
  }
);

module.exports = model("usersonginteractions", userSongInteractionSchema);
