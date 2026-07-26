// Central place for all socket event name strings.
// Prevents typo bugs and gives one place to update event names
// as new features are added.

module.exports = {
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  DISCONNECTING: "disconnecting", // built-in socket.io event, fires before rooms are left

  // Client → Server
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  SEND_MESSAGE: "send_message",
  SEND_PRIVATE_MESSAGE: "send_private_message",
  REQUEST_MEMBERS: "request_members",
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",
  MARK_SEEN: "mark_seen",

  // Server → Client
  ROOM_JOINED: "room_joined",
  ROOM_LEFT: "room_left",
  NEW_MESSAGE: "new_message",
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  ROOM_MEMBERS: "room_members",
  MESSAGE_STATUS_UPDATE: "message_status_update",
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
  ERROR: "error",
};
