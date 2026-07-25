const EVENTS = require("../../constants/events");
const { isValidRoomPayload } = require("../../utils/socketValidators");
const emitError = require("../../utils/emitError");
const presenceService = require("../../services/presenceService");

/**
 * Handles room join/leave for a single socket.
 * Uses Socket.IO's built-in room feature for message routing,
 * and delegates membership tracking/counts to presenceService —
 * this handler stays thin, no membership logic lives here.
 *
 * socket.data.currentRoom is a lightweight convenience slot.
 * When JWT auth is added, socket.data is also where the
 * authenticated user (id, username) will be attached —
 * no change to this join/leave logic will be required.
 */
function registerRoomHandlers(socket, io) {
  socket.on(EVENTS.JOIN_ROOM, async (payload) => {
    try {
      if (!isValidRoomPayload(payload)) {
        return emitError(socket, "Invalid or missing room name.");
      }

      const { room } = payload;
      socket.join(room);
      socket.data.currentRoom = room;

      await presenceService.addMember(room, socket.id);
      const count = await presenceService.getMemberCount(room);

      socket.emit(EVENTS.ROOM_JOINED, { room, count });
      socket.to(room).emit(EVENTS.USER_JOINED, { room, socketId: socket.id, count });
    } catch (err) {
      console.error("[roomHandler] join_room error:", err.message);
      emitError(socket, "Failed to join room.");
    }
  });

  socket.on(EVENTS.LEAVE_ROOM, async (payload) => {
    try {
      if (!isValidRoomPayload(payload)) {
        return emitError(socket, "Invalid or missing room name.");
      }

      const { room } = payload;
      socket.leave(room);

      await presenceService.removeMember(room, socket.id);
      const count = await presenceService.getMemberCount(room);

      if (socket.data.currentRoom === room) {
        socket.data.currentRoom = null;
      }

      socket.emit(EVENTS.ROOM_LEFT, { room });
      socket.to(room).emit(EVENTS.USER_LEFT, { room, socketId: socket.id, count });
    } catch (err) {
      console.error("[roomHandler] leave_room error:", err.message);
      emitError(socket, "Failed to leave room.");
    }
  });
}

module.exports = registerRoomHandlers;
