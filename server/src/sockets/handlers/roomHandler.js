const EVENTS = require("../../constants/events");
const { isValidRoomPayload } = require("../../utils/socketValidators");
const emitError = require("../../utils/emitError");
const presenceService = require("../../services/presenceService");
const messageService = require("../../services/messageService");
const conversationService = require("../../services/conversationService");

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
      await conversationService.assertConversationAccess(socket.data.user.id, room);
      socket.join(room);
      socket.data.currentRoom = room;

      await presenceService.addMember(
        room,
        socket.id,
        socket.data.user.id,
        socket.data.user.username,
        socket.data.user.profileImage,
      );
      const count = await presenceService.getMemberCount(room);

      socket.emit(EVENTS.ROOM_JOINED, { room, count });
      socket.to(room).emit(EVENTS.USER_JOINED, {
        room,
        socketId: socket.id,
        userId: socket.data.user.id,
        username: socket.data.user.username,
        profileImage: socket.data.user.profileImage || "",
        count,
      });

      const deliveredIds = await messageService.markRoomMessagesDelivered(
        room,
        socket.data.user.id
      );
      if (deliveredIds.length > 0) {
        io.to(room).emit(EVENTS.MESSAGE_STATUS_UPDATE, {
          room,
          messageIds: deliveredIds,
          status: "delivered",
        });
      }
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
      if (!socket.rooms.has(room)) {
        return emitError(socket, `You are not a member of room "${room}".`);
      }

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
