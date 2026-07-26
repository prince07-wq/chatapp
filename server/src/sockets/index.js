const { Server } = require("socket.io");
const config = require("../config");
const EVENTS = require("../constants/events");
const registerConnectionHandlers = require("./handlers/connectionHandler");
const registerRoomHandlers = require("./handlers/roomHandler");
const registerMessageHandlers = require("./handlers/messageHandler");
const registerPresenceHandlers = require("./handlers/presenceHandler");
const registerTypingHandlers = require("./handlers/typingHandler");
const registerReadReceiptHandlers = require("./handlers/readReceiptHandler");
const authenticateSocket = require("./middleware/authenticateSocket");

/**
 * Initializes Socket.IO on top of an existing HTTP server.
 * This file only wires handlers together — no business logic,
 * no validation, no broadcasting logic lives here.
 */
function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: config.CLIENT_URL,
    },
  });

  io.use(authenticateSocket);

  io.on(EVENTS.CONNECTION, (socket) => {
    registerConnectionHandlers(socket, io);
    registerRoomHandlers(socket, io);
    registerMessageHandlers(socket, io);
    registerPresenceHandlers(socket, io);
    registerTypingHandlers(socket, io);
    registerReadReceiptHandlers(socket, io);
  });

  return io;
}

module.exports = initSocket;
