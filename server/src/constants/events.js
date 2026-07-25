// Central place for all socket event name strings.
// Prevents typo bugs and gives one place to update event names
// as new features are added.

module.exports = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  // Client → Server
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  SEND_MESSAGE: "send_message",

  // Server → Client
  ROOM_JOINED: "room_joined",
  ROOM_LEFT: "room_left",
  NEW_MESSAGE: "new_message",
  ERROR: "error",

  // Reserved for upcoming phases:
  // TYPING_START: "typing:start",
  // PRESENCE_UPDATE: "presence:update",
};
