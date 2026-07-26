const EVENTS = require("../../constants/events");
const { isValidMessagePayload } = require("../../utils/socketValidators");
const emitError = require("../../utils/emitError");
const messageService = require("../../services/messageService");
const presenceService = require("../../services/presenceService");

/**
 * Handles sending a message to a room.
 * Validates, persists via messageService, then broadcasts only to
 * clients currently joined to that room (io.to(room)).
 *
 * If other members are already online in the room at send time,
 * the message is immediately marked "delivered" (read receipts).
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

      const members = await presenceService.getMembers(room);
      const hasOtherOnlineMember = members.some((m) => m.socketId !== socket.id);

      let finalMessage = saved;
      if (hasOtherOnlineMember) {
        finalMessage = (await messageService.markDelivered(saved._id)) || saved;
      }

      io.to(room).emit(EVENTS.NEW_MESSAGE, {
        id: finalMessage._id,
        room: finalMessage.room,
        message: finalMessage.message,
        senderId: finalMessage.senderId,
        senderUsername: finalMessage.senderUsername,
        status: finalMessage.status,
        sentAt: finalMessage.createdAt,
      });
    } catch (err) {
      console.error("[messageHandler] send_message error:", err.message);
      emitError(socket, "Failed to send message.");
    }
  });
}

module.exports = registerMessageHandlers;
