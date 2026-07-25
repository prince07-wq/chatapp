const EVENTS = require("../../constants/events");
const { isValidRoomPayload } = require("../../utils/socketValidators");
const emitError = require("../../utils/emitError");

/**
 * Handles room join/leave for a single socket.
 * Uses Socket.IO's built-in room feature — no separate
 * in-memory room registry needed for this phase.
 *
 * socket.data.currentRoom is a lightweight convenience slot.
 * When JWT auth is added, this same socket.data object is where
 * the authenticated user (id, username) will be attached —
 * no change to the join/leave logic itself will be required.
 */
function registerRoomHandlers(socket, io) {
  socket.on(EVENTS.JOIN_ROOM, (payload) => {
    try {
      if (!isValidRoomPayload(payload)) {
        return emitError(socket, "Invalid or missing room name.");
      }

      const { room } = payload;
      socket.join(room);
      socket.data.currentRoom = room;

      socket.emit(EVENTS.ROOM_JOINED, { room });
    } catch (err) {
      console.error("[roomHandler] join_room error:", err.message);
      emitError(socket, "Failed to join room.");
    }
  });

  socket.on(EVENTS.LEAVE_ROOM, (payload) => {
    try {
      if (!isValidRoomPayload(payload)) {
        return emitError(socket, "Invalid or missing room name.");
      }

      const { room } = payload;
      socket.leave(room);

      if (socket.data.currentRoom === room) {
        socket.data.currentRoom = null;
      }

      socket.emit(EVENTS.ROOM_LEFT, { room });
    } catch (err) {
      console.error("[roomHandler] leave_room error:", err.message);
      emitError(socket, "Failed to leave room.");
    }
  });
}

module.exports = registerRoomHandlers;
