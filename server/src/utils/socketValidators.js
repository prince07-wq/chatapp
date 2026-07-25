/**
 * Reusable validation helpers for socket payloads.
 * Shared across room and message handlers (and future
 * typing/presence handlers) to keep validation consistent.
 */

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidRoomPayload(payload) {
  return (
    payload !== null &&
    typeof payload === "object" &&
    isNonEmptyString(payload.room)
  );
}

function isValidMessagePayload(payload) {
  return (
    payload !== null &&
    typeof payload === "object" &&
    isNonEmptyString(payload.room) &&
    isNonEmptyString(payload.message)
  );
}

module.exports = {
  isNonEmptyString,
  isValidRoomPayload,
  isValidMessagePayload,
};
