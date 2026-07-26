const EVENTS = require("../../constants/events");
const { isValidMessagePayload } = require("../../utils/socketValidators");
const emitError = require("../../utils/emitError");
const messageService = require("../../services/messageService");

/**
 * Handles sending a message to a room.
 * Validates, persists via messageService, then broadcasts only to
 * clients currently joined to that room (io.to(room)).
 */
function registerMessageHandlers(socket, io) {
  socket.on(EVENTS.SEND_MESSAGE, async (payload) => {
    try {
      if (!isValidMessagePayload(payload)) {
        return emitError(
          socket,
          "Invalid message payload. 'room' and 'message' are required."
        );
      }

      const { room, message } = payload;

      if (!socket.rooms.has(room)) {
        return emitError(socket, `You are not a member of room "${room}".`);
      }

      const saved = await messageService.createMessage({
        room,
        senderId: socket.data.user.id,
        senderUsername: socket.data.user.username,
        message,
      });

      io.to(room).emit(EVENTS.NEW_MESSAGE, {
        room: saved.room,
        message: saved.message,
        senderId: saved.senderId,
        senderUsername: saved.senderUsername,
        sentAt: saved.createdAt,
      });
    } catch (err) {
      console.error("[messageHandler] send_message error:", err.message);
      emitError(socket, "Failed to send message.");
    }
  });
}

module.exports = registerMessageHandlers;
