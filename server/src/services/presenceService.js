/**
 * Presence service — tracks which sockets are currently in which rooms.
 *
 * In-memory implementation using nested Maps. All exported functions are
 * async by design: callers already `await` them, so swapping this file's
 * internals for a Redis-backed implementation later (e.g. Redis SETs per
 * room, or Redis hashes for member metadata) requires NO changes to any
 * handler or calling code — only this file's internals change.
 *
 * Note: this service intentionally does not read socket.io's internal
 * socket.rooms — it keeps its own independent membership record, since
 * Redis (or any future store) won't have access to socket.io internals.
 */

// room -> Map<socketId, { socketId, userId, username, joinedAt }>
const rooms = new Map();

// userId -> { userId, username, socketIds: Set<socketId> }
// Tracks global online status, independent of rooms — supports
// multiple tabs/sockets per user without duplicating entries.
const onlineUsers = new Map();

/**
 * Registers a socket connection for a user.
 * Returns true only if this is the user's FIRST active connection
 * (i.e. they just came online) — caller uses this to decide
 * whether to broadcast a "user online" event.
 */
async function addUserConnection(userId, username, socketId) {
  const isNewlyOnline = !onlineUsers.has(userId);

  if (isNewlyOnline) {
    onlineUsers.set(userId, { userId, username, socketIds: new Set() });
  }

  onlineUsers.get(userId).socketIds.add(socketId);
  return isNewlyOnline;
}

/**
 * Removes a socket connection for a user.
 * Returns true only if the user has NO remaining active connections
 * (i.e. they just went fully offline) — caller uses this to decide
 * whether to broadcast a "user offline" event.
 */
async function removeUserConnection(userId, socketId) {
  const entry = onlineUsers.get(userId);
  if (!entry) return false;

  entry.socketIds.delete(socketId);

  if (entry.socketIds.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }

  return false;
}

async function getOnlineUsers() {
  return Array.from(onlineUsers.values()).map(({ userId, username }) => ({
    userId,
    username,
  }));
}

async function addMember(room, socketId, userId, username) {
  if (!rooms.has(room)) {
    rooms.set(room, new Map());
  }
  rooms.get(room).set(socketId, {
    socketId,
    userId,
    username,
    joinedAt: new Date().toISOString(),
  });
}

async function removeMember(room, socketId) {
  const members = rooms.get(room);
  if (!members) return;

  members.delete(socketId);
  if (members.size === 0) {
    rooms.delete(room);
  }
}

/**
 * Removes a socket from every room it belongs to.
 * Returns the list of rooms it was removed from, so the caller
 * can broadcast USER_LEFT to each affected room.
 */
async function removeMemberFromAllRooms(socketId) {
  const affectedRooms = [];

  for (const [room, members] of rooms.entries()) {
    if (members.has(socketId)) {
      members.delete(socketId);
      affectedRooms.push(room);
      if (members.size === 0) {
        rooms.delete(room);
      }
    }
  }

  return affectedRooms;
}

async function getMembers(room) {
  const members = rooms.get(room);
  return members ? Array.from(members.values()) : [];
}

async function getMemberCount(room) {
  const members = rooms.get(room);
  return members ? members.size : 0;
}

module.exports = {
  addMember,
  removeMember,
  removeMemberFromAllRooms,
  getMembers,
  getMemberCount,
  addUserConnection,
  removeUserConnection,
  getOnlineUsers,
};
