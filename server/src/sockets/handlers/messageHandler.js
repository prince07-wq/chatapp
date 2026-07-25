const EVENTS = require("../../constants/events");
const { isValidMessagePayload } = require("../../utils/socketValidators");
const emitError = require("../../utils/emitError");

/**
 * Handles sending a message to a room.
 * Only broadcasts to clients currently joined to that room
 * (io.to(room)), never globally.
 *
 * senderId currently falls back to the raw socket.id.
 * Once JWT auth is added, this will read from the authenticated
 * user attached to socket.data (e.g. socket.data.user.id) instead —
 * the broadcast logic itself will not need to change.
 *
 * Persisting messageData to MongoDB later is a single insertion
 * point right before the io.to(room).emit call below.
 */
function registerMessageHandlers(socket, io) {
  socket.on(EVENTS.SEND_MESSAGE, (payload) => {
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

      const messageData = {
        room,
        message,
        senderId: socket.data.user.id,
        senderUsername: socket.data.user.username,
        sentAt: new Date().toISOString(),
      };

      // Future: await Message.create(messageData) goes here, before broadcasting.

      io.to(room).emit(EVENTS.NEW_MESSAGE, messageData);
    } catch (err) {
      console.error("[messageHandler] send_message error:", err.message);
      emitError(socket, "Failed to send message.");
    }
  });
}

module.exports = registerMessageHandlers;
