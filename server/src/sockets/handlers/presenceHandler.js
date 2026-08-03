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
  // Global online tracking — runs once per new socket connection.
  // Only broadcasts USER_ONLINE if this is the user's first active
  // connection, so multiple tabs from the same user don't duplicate
  // the online list or spam broadcasts.
  (async () => {
    try {
      const isNewlyOnline = await presenceService.addUserConnection(
        socket.data.user.id,
        socket.data.user.username,
        socket.id,
        socket.data.user.profileImage,
      );

      if (isNewlyOnline) {
        io.emit(EVENTS.USER_ONLINE, {
          userId: socket.data.user.id,
          username: socket.data.user.username,
          profileImage: socket.data.user.profileImage || "",
        });
      }
    } catch (err) {
      console.error("[presenceHandler] online registration error:", err.message);
    }
  })();

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

      const isNowOffline = await presenceService.removeUserConnection(
        socket.data.user.id,
        socket.id
      );

      if (isNowOffline) {
        io.emit(EVENTS.USER_OFFLINE, {
          userId: socket.data.user.id,
          username: socket.data.user.username,
        });
      }
    } catch (err) {
      console.error("[presenceHandler] disconnecting cleanup error:", err.message);
    }
  });
}

module.exports = registerPresenceHandlers;
