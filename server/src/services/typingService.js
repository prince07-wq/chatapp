const EVENTS = require("../constants/events");

/**
 * Typing indicator service.
 *
 * Owns one timer per (room, socketId) pair. Handles two responsibilities
 * that don't belong in a thin socket handler:
 *
 * 1. Auto-clear: if no stop/refresh arrives within TYPING_TIMEOUT_MS,
 *    a TYPING_STOP is broadcast automatically. There's no client event
 *    to hook this on — only the service, which owns the timer, can do it.
 *
 * 2. Spam prevention: if a client fires "start typing" repeatedly
 *    (e.g. once per keystroke), only the FIRST call in a burst triggers
 *    a broadcast. Every subsequent call just silently resets the timer.
 *    This protects other clients regardless of frontend behavior.
 */

const TYPING_TIMEOUT_MS = 3000;

// key `${room}:${socketId}` -> Timeout
const timers = new Map();

function keyFor(room, socketId) {
  return `${room}:${socketId}`;
}

function startTyping(io, room, socketId) {
  const key = keyFor(room, socketId);
  const alreadyTyping = timers.has(key);

  if (alreadyTyping) {
    clearTimeout(timers.get(key));
  } else {
    // first event of this burst — broadcast once
    io.to(room).emit(EVENTS.TYPING_START, { room, socketId });
  }

  const timeout = setTimeout(() => {
    timers.delete(key);
    io.to(room).emit(EVENTS.TYPING_STOP, { room, socketId });
  }, TYPING_TIMEOUT_MS);

  timers.set(key, timeout);
}

function stopTyping(io, room, socketId) {
  const key = keyFor(room, socketId);

  if (timers.has(key)) {
    clearTimeout(timers.get(key));
    timers.delete(key);
  }

  io.to(room).emit(EVENTS.TYPING_STOP, { room, socketId });
}

/**
 * Called on abrupt disconnect — clears every timer belonging to this
 * socket across all rooms, and notifies each room the typing stopped.
 */
function clearAllForSocket(io, socketId) {
  for (const [key, timeout] of timers.entries()) {
    const [room, sid] = key.split(":");
    if (sid === socketId) {
      clearTimeout(timeout);
      timers.delete(key);
      io.to(room).emit(EVENTS.TYPING_STOP, { room, socketId });
    }
  }
}

module.exports = {
  startTyping,
  stopTyping,
  clearAllForSocket,
  TYPING_TIMEOUT_MS,
};
