const EVENTS = require("../../constants/events");
const { isValidRoomPayload } = require("../../utils/socketValidators");
const emitError = require("../../utils/emitError");
const presenceService = require("../../services/presenceService");

/**
 * Handles presence-related requests and cleanup.
 * All membership logic lives in presenceService — this file
 * only validates input and wires events to that service.
 */
function registerPresenceHandlers(socket, io) {
  socket.on(EVENTS.REQUEST_MEMBERS, async (payload) => {
    try {
      if (!isValidRoomPayload(payload)) {
        return emitError(socket, "Invalid or missing room name.");
      }

      const { room } = payload;
      const members = await presenceService.getMembers(room);

      socket.emit(EVENTS.ROOM_MEMBERS, {
        room,
        members,
        count: members.length,
      });
    } catch (err) {
      console.error("[presenceHandler] request_members error:", err.message);
      emitError(socket, "Failed to fetch room members.");
    }
  });

  // "disconnecting" (not "disconnect") fires while the socket still
  // knows which rooms it was in — needed to clean up presence correctly
  // when a client disappears without explicitly emitting LEAVE_ROOM.
  socket.on(EVENTS.DISCONNECTING, async () => {
    try {
      const affectedRooms = await presenceService.removeMemberFromAllRooms(socket.id);

      for (const room of affectedRooms) {
        const count = await presenceService.getMemberCount(room);
        socket.to(room).emit(EVENTS.USER_LEFT, { room, socketId: socket.id, count });
      }
    } catch (err) {
      console.error("[presenceHandler] disconnecting cleanup error:", err.message);
    }
  });
}

module.exports = registerPresenceHandlers;
