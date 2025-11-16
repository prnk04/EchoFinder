const mongoose = require("mongoose");

async function connectMongo() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Mongo uri is missing");
    await mongoose.connect(uri, { autoIndex: true });
    console.log("Connected to mongo db");
  } catch (error) {
    console.log("Error while connecting to mongo db: ", error);
  }
}
module.exports = { connectMongo };
