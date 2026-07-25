require("dotenv").config();

// Single source of truth for environment/config values.
// Rest of the app imports FROM here, never touches process.env directly.
module.exports = {
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
};
