const server = require("./src/server");
const config = require("./src/config");
const connectDB = require("./src/config/db");

/**
 * Entry point. Only job: connect to DB, then start listening.
 */
connectDB()
  .then(() => {
    server.listen(config.PORT, () => {
      console.log(`Server running on port ${config.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
