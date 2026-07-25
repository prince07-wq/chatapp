const server = require("./src/server");
const config = require("./src/config");

/**
 * Entry point. Only job: start listening.
 * No app config, no socket config, no business logic here.
 */
server.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
