const EVENTS = require("../../constants/events");
const { isValidRoomPayload } = require("../../utils/socketValidators");
const emitError = require("../../utils/emitError");
const messageService = require("../../services/messageService");

/**
 * Handles marking a room's messages as "seen" when the client
 * opens/reads that chat. All logic lives in messageService —
 * this handler only validates and delegates.
 */
function registerReadReceiptHandlers(socket, io) {
  socket.on(EVENTS.MARK_SEEN, async (payload) => {
    try {
      if (!isValidRoomPayload(payload)) {
        return emitError(socket, "Invalid or missing room name.");
      }

      const { room } = payload;

      if (!socket.rooms.has(room)) {
        return emitError(socket, `You are not a member of room "${room}".`);
      }

      const seenIds = await messageService.markRoomMessagesSeen(
        room,
        socket.data.user.id
      );

      if (seenIds.length > 0) {
        io.to(room).emit(EVENTS.MESSAGE_STATUS_UPDATE, {
          room,
          messageIds: seenIds,
          status: "seen",
        });
      }
    } catch (err) {
      console.error("[readReceiptHandler] mark_seen error:", err.message);
      emitError(socket, "Failed to mark messages as seen.");
    }
  });
}

module.exports = registerReadReceiptHandlers;
