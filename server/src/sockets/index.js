const { Server } = require("socket.io");
const config = require("../config");
const EVENTS = require("../constants/events");
const registerConnectionHandlers = require("./handlers/connectionHandler");
const registerRoomHandlers = require("./handlers/roomHandler");
const registerMessageHandlers = require("./handlers/messageHandler");

/**
 * Initializes Socket.IO on top of an existing HTTP server.
 * This file only wires handlers together — no business logic,
 * no validation, no broadcasting logic lives here.
 *
 * Adding typing/presence handlers later means adding one more
 * require + one more register call below, nothing else.
 */
function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: config.CLIENT_URL,
    },
  });

  io.on(EVENTS.CONNECTION, (socket) => {
    registerConnectionHandlers(socket, io);
    registerRoomHandlers(socket, io);
    registerMessageHandlers(socket, io);

    // Future phases:
    // registerTypingHandlers(socket, io);
    // registerPresenceHandlers(socket, io);
  });

  return io;
}

module.exports = initSocket;
