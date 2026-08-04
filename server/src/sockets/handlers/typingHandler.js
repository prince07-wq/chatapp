const EVENTS = require("../../constants/events");
const { isValidRoomPayload } = require("../../utils/socketValidators");
const emitError = require("../../utils/emitError");
const typingService = require("../../services/typingService");
const conversationService = require("../../services/conversationService");

/**
 * Handles typing start/stop for a single socket.
 * All timer/broadcast/spam-prevention logic lives in typingService —
 * this handler only validates input and delegates.
 */
function registerTypingHandlers(socket, io) {
  socket.on(EVENTS.TYPING_START, async (payload) => {
    try {
      if (!isValidRoomPayload(payload)) {
        return emitError(socket, "Invalid or missing room name.");
      }

      const { room } = payload;

      await conversationService.assertConversationAccess(socket.data.user.id, room);

      if (!socket.rooms.has(room)) {
        return emitError(socket, `You are not a member of room "${room}".`);
      }

      typingService.startTyping(io, room, socket.id);
    } catch (err) {
      console.error("[typingHandler] typing_start error:", err.message);
      emitError(socket, "Failed to update typing status.");
    }
  });

  socket.on(EVENTS.TYPING_STOP, async (payload) => {
    try {
      if (!isValidRoomPayload(payload)) {
        return emitError(socket, "Invalid or missing room name.");
      }

      const { room } = payload;
      await conversationService.assertConversationAccess(socket.data.user.id, room);

      if (!socket.rooms.has(room)) {
        return emitError(socket, `You are not a member of room "${room}".`);
      }

      typingService.stopTyping(io, room, socket.id);
    } catch (err) {
      console.error("[typingHandler] typing_stop error:", err.message);
      emitError(socket, "Failed to update typing status.");
    }
  });

  socket.on(EVENTS.DISCONNECTING, () => {
    try {
      typingService.clearAllForSocket(io, socket.id);
    } catch (err) {
      console.error("[typingHandler] disconnecting cleanup error:", err.message);
    }
  });
}

module.exports = registerTypingHandlers;
