const mongoose = require("mongoose");
const config = require("./index");

async function connectDB() {
  await mongoose.connect(config.MONGO_URI);
  console.log("MongoDB connected");
}

module.exports = connectDB;
