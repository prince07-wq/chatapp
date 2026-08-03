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
  if (payload === null || typeof payload !== "object") return false;
  if (!isNonEmptyString(payload.room)) return false;
  if (
    payload.replyToMessageId !== undefined &&
    !isNonEmptyString(payload.replyToMessageId)
  ) {
    return false;
  }

  const hasText = isNonEmptyString(payload.message);
  const hasAttachment = payload.attachment && isNonEmptyString(payload.attachment.fileUrl);

  return hasText || hasAttachment;
}

function isValidPrivateMessagePayload(payload) {
  if (payload === null || typeof payload !== "object") return false;
  if (!isNonEmptyString(payload.recipientId)) return false;
  if (
    payload.replyToMessageId !== undefined &&
    !isNonEmptyString(payload.replyToMessageId)
  ) {
    return false;
  }

  const hasText = isNonEmptyString(payload.message);
  const hasAttachment = payload.attachment && isNonEmptyString(payload.attachment.fileUrl);

  return hasText || hasAttachment;
}

function isValidReactionPayload(payload, isAllowedReaction) {
  return (
    payload !== null &&
    typeof payload === "object" &&
    isNonEmptyString(payload.room) &&
    isNonEmptyString(payload.messageId) &&
    ["set", "remove"].includes(payload.action || "set") &&
    isAllowedReaction(payload.emoji)
  );
}

module.exports = {
  isNonEmptyString,
  isValidRoomPayload,
  isValidMessagePayload,
  isValidPrivateMessagePayload,
  isValidReactionPayload,
};
