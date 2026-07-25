const EVENTS = require("../constants/events");

/**
 * Emits a consistent ERROR event shape to a single client.
 * Centralizing this means the error payload shape can change
 * in one place (e.g. add an error code later) without touching
 * every handler.
 */
function emitError(socket, message) {
  socket.emit(EVENTS.ERROR, { message });
}

module.exports = emitError;
