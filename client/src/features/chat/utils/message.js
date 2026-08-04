import { resolveUploadedFileUrl } from "../../../api/fileApi.js";

export const MESSAGE_STATUS_RANK = { sent: 1, delivered: 2, seen: 3 };
export const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;

export function formatMessageTime(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function normalizeMessageReactions(value) {
  if (!Array.isArray(value)) return [];
  const seenUserIds = new Set();
  return value.reduce((activeReactions, reaction) => {
    if (!reaction?.emoji || !Array.isArray(reaction.userIds)) return activeReactions;
    const usersById = new Map((reaction.users || []).map((user) => [String(user.userId), { userId: String(user.userId), username: user.username || "Unknown user", profileImage: resolveUploadedFileUrl(user.profileImage) }]));
    const userIds = [...new Set(reaction.userIds.map(String))].filter((userId) => {
      if (seenUserIds.has(userId)) return false;
      seenUserIds.add(userId);
      return true;
    });
    if (!userIds.length) return activeReactions;
    activeReactions.push({ emoji: reaction.emoji, userIds, users: userIds.map((userId) => usersById.get(userId) || { userId, username: "Unknown user", profileImage: "" }) });
    return activeReactions;
  }, []);
}

export function normalizeSocketMessage(incomingMessage, currentUserId) {
  const message = incomingMessage?.message && typeof incomingMessage.message === "object" ? incomingMessage.message : incomingMessage;
  const text = message?.content ?? message?.text ?? (typeof incomingMessage?.message === "string" ? incomingMessage.message : "");
  const rawAttachment = message?.attachment ?? incomingMessage?.attachment;
  const attachment = rawAttachment?.fileUrl ? { fileUrl: resolveUploadedFileUrl(rawAttachment.fileUrl), fileName: rawAttachment.fileName, mimeType: rawAttachment.mimeType } : null;
  const rawReplyTo = message?.replyTo ?? incomingMessage?.replyTo;
  const replyTo = rawReplyTo?.messageId ? { messageId: String(rawReplyTo.messageId), senderId: rawReplyTo.senderId == null ? null : String(rawReplyTo.senderId), senderUsername: rawReplyTo.senderUsername || "Unknown user", message: rawReplyTo.message || "", attachment: rawReplyTo.attachment || null } : null;
  if (!text && !attachment) return null;
  const sender = message.senderId ?? message.sender ?? message.userId ?? incomingMessage?.senderId ?? incomingMessage?.sender ?? incomingMessage?.userId;
  const senderId = sender && typeof sender === "object" ? sender._id ?? sender.id : sender;
  const createdAt = message.createdAt ?? message.sentAt ?? message.timestamp ?? incomingMessage?.createdAt ?? incomingMessage?.sentAt ?? incomingMessage?.timestamp;
  const messageId = message._id ?? message.id ?? incomingMessage?._id ?? incomingMessage?.id ?? message.clientMessageId ?? `${incomingMessage?.room ?? "unknown-room"}-${senderId ?? "unknown"}-${createdAt ?? text}`;
  const rawStatus = message.status ?? message.deliveryStatus ?? (message.read === true ? "seen" : undefined);
  return { id: `socket-${messageId}`, backendId: String(messageId), text, attachment, replyTo, reactions: normalizeMessageReactions(message?.reactions ?? incomingMessage?.reactions), reactionsUpdatedAt: message?.reactionsUpdatedAt ?? incomingMessage?.reactionsUpdatedAt ?? null, createdAt: createdAt ?? new Date().toISOString(), time: message.time ?? formatMessageTime(createdAt), direction: senderId != null && String(senderId) === String(currentUserId) ? "outgoing" : "incoming", senderId: senderId == null ? null : String(senderId), senderUsername: message.senderUsername ?? incomingMessage?.senderUsername ?? null, isPrivate: Boolean(message.isPrivate ?? incomingMessage?.isPrivate), status: rawStatus === "read" ? "seen" : rawStatus, edited: Boolean(message.editedAt ?? incomingMessage?.editedAt), room: message.room ?? incomingMessage?.room };
}

function reactionRevision(message) { const value = new Date(message?.reactionsUpdatedAt || 0).getTime(); return Number.isNaN(value) ? 0 : value; }
export function getNewestReactionState(primary, candidate) { const source = reactionRevision(candidate) >= reactionRevision(primary) ? candidate : primary; return { reactions: source?.reactions ?? [], reactionsUpdatedAt: source?.reactionsUpdatedAt ?? null }; }
export function latestMessageStatus(currentStatus, nextStatus) { return (MESSAGE_STATUS_RANK[nextStatus] ?? 0) > (MESSAGE_STATUS_RANK[currentStatus] ?? 0) ? nextStatus : currentStatus; }
export function formatRelativeTime(value, now) { const timestamp = new Date(value).getTime(); if (Number.isNaN(timestamp)) return "just now"; const elapsed = Math.max(0, now - timestamp); const minutes = Math.floor(elapsed / 60000); const hours = Math.floor(elapsed / 3600000); if (minutes < 1) return "just now"; if (minutes < 60) return `${minutes}m ago`; if (hours < 24) return `${hours}h ago`; if (hours < 48) return "Yesterday"; return new Intl.DateTimeFormat([], { month: "short", day: "numeric" }).format(new Date(timestamp)); }
export function isLaterMessage(candidate, current) { if (!current) return true; const candidateTime = new Date(candidate.createdAt).getTime(); const currentTime = new Date(current.createdAt).getTime(); if (Number.isNaN(candidateTime)) return false; if (Number.isNaN(currentTime)) return true; return candidateTime >= currentTime; }
export function canEditMessage(message, now = Date.now()) { if (message?.direction !== "outgoing" || !message.backendId || !message.text || message.attachment) return false; const createdAt = new Date(message.createdAt).getTime(); return Number.isFinite(createdAt) && now - createdAt >= 0 && now - createdAt <= MESSAGE_EDIT_WINDOW_MS; }
