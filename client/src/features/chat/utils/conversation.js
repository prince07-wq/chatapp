import { formatRelativeTime } from "./message.js";

export function getDmRoomId(userIdA, userIdB) {
  if (userIdA == null || userIdB == null) return null;
  const ids = [String(userIdA), String(userIdB)];
  if (!ids[0] || !ids[1] || ids[0] === ids[1]) return null;
  return ids.sort().join("_");
}

export function getUserInitials(username) {
  return String(username || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getRoomPreview(chat, roomSummary, now) {
  const latestMessage = roomSummary?.latestMessage;
  const latestReaction = roomSummary?.latestReaction;
  const latestMessageTime = new Date(latestMessage?.createdAt || 0).getTime();
  const latestReactionTime = new Date(latestReaction?.createdAt || 0).getTime();

  if (latestReaction && (Number.isNaN(latestMessageTime) || latestReactionTime > latestMessageTime)) {
    return { preview: `${latestReaction.emoji} Reacted to your message`, time: formatRelativeTime(latestReaction.createdAt, now) };
  }
  if (!latestMessage) {
    return {
      preview: chat?.preview || "Start a conversation",
      time: chat?.time || "",
    };
  }

  const relativeTime = formatRelativeTime(latestMessage.createdAt, now);
  if (latestMessage.direction === "outgoing") {
    const status = latestMessage.status === "seen" ? "Seen" : latestMessage.status === "delivered" ? "Delivered" : "Sent";
    return { preview: `${status} ${relativeTime}`, time: "" };
  }

  const mimeType = latestMessage.attachment?.mimeType;
  const attachmentPreview = mimeType?.startsWith("image/") ? "Photo" : mimeType?.startsWith("audio/") ? "Voice message" : latestMessage.attachment?.fileName || "File";
  return { preview: latestMessage.text || attachmentPreview, time: relativeTime };
}

export function getConversationActivityTime(roomSummary) {
  const messageTime = new Date(roomSummary?.latestMessage?.createdAt || 0).getTime();
  const reactionTime = new Date(roomSummary?.latestReaction?.createdAt || 0).getTime();
  return Math.max(Number.isNaN(messageTime) ? 0 : messageTime, Number.isNaN(reactionTime) ? 0 : reactionTime);
}

export function isConversationMuted(conversation, now) {
  if (!conversation) return false;
  if (!conversation.mutedUntil) return true;
  const mutedUntil = new Date(conversation.mutedUntil).getTime();
  return !Number.isNaN(mutedUntil) && mutedUntil > now;
}
