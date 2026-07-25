require("dotenv").config();

// Single source of truth for environment/config values.
// Rest of the app imports FROM here, never touches process.env directly.
module.exports = {
  PORT: process.env.PORT || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  NODE_ENV: process.env.NODE_ENV || "development",
};
