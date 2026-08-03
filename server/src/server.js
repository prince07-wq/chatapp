const http = require("http");
const app = require("./app");
const initSocket = require("./sockets");

/**
 * Bridges Express (HTTP) and Socket.IO (real-time).
 * Creates the raw http server from the Express app,
 * then attaches socket.io to it.
 * Does NOT call .listen() — that's index.js's job.
 */
const server = http.createServer(app);
const io = initSocket(server);
app.set("io", io);

module.exports = server;
