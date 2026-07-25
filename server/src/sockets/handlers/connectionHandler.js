const EVENTS = require("../../constants/events");

/**
 * Handles basic connection lifecycle for a single socket.
 * This is the only handler implemented in the foundation phase.
 * Room/message/typing/presence handlers will follow this same
 * pattern: (socket, io) => { socket.on(EVENT, ...) }
 */
function registerConnectionHandlers(socket, io) {
  console.log(`[socket] connected: ${socket.id}`);

  socket.on(EVENTS.DISCONNECT, () => {
    console.log(`[socket] disconnected: ${socket.id}`);
  });
}

module.exports = registerConnectionHandlers;
