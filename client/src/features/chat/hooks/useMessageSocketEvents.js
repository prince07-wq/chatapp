import {
  latestMessageStatus,
  MESSAGE_STATUS_RANK,
  normalizeMessageReactions,
  normalizeSocketMessage,
} from "../utils/message.js";

export default function useMessageSocketEvents({
  chat,
  currentUserId,
  messages,
  selection,
  unread,
}) {
  function handleReceiveMessage(incomingMessage) {
    const message = normalizeSocketMessage(incomingMessage, currentUserId);
    if (!message || chat.receivedSocketMessageIdsRef.current.has(message.id)) return;
    if (chat.hiddenMessageIdsRef.current.has(message.backendId)) return;
    if (
      message.direction === "incoming" &&
      chat.deletedConversationRoomsRef.current.has(message.room)
    ) selection.restoreDeletedConversation(message.room);
    chat.receivedSocketMessageIdsRef.current.add(message.id);
    unread.updateRoomLatestMessage(message);
    if (
      message.isPrivate &&
      message.senderId != null &&
      String(message.senderId) !== String(currentUserId)
    ) {
      chat.setDmConversationUserIds((ids) => new Set(ids).add(message.senderId));
      chat.setAvailableDmUsers((users) =>
        users.some((user) => user.userId === message.senderId)
          ? users
          : [...users, { userId: message.senderId, username: message.senderUsername || "User" }],
      );
    }
    const isActiveRoom = String(message.room) === chat.activeRoomRef.current;
    const incomingFromOther =
      message.direction === "incoming" &&
      message.senderId != null &&
      String(message.senderId) !== String(currentUserId);
    if (incomingFromOther && (!isActiveRoom || !chat.isNearBottomRef.current)) {
      unread.incrementRoomUnread(message.room);
    }
    if (!isActiveRoom) return;
    chat.setChatMessages((current) => {
      if (current.some((item) => item.id === message.id)) return current;
      chat.shouldAutoScrollNewMessageRef.current = chat.isNearBottomRef.current;
      return [...current, message];
    });
  }

  function handleMessageStatusUpdate({ room, messageIds = [], status } = {}) {
    if (!room || !MESSAGE_STATUS_RANK[status] || !Array.isArray(messageIds)) return;
    const ids = new Set(messageIds.map((messageId) => `socket-${messageId}`));
    chat.setChatMessages((current) =>
      current.map((message) => {
        if (!ids.has(message.id)) return message;
        const nextStatus = latestMessageStatus(message.status, status);
        return nextStatus === message.status ? message : { ...message, status: nextStatus };
      }),
    );
    chat.setRoomSummaries((summaries) => {
      const summary = summaries[room];
      const latest = summary?.latestMessage;
      if (!latest || !ids.has(latest.id)) return summaries;
      const nextStatus = latestMessageStatus(latest.status, status);
      if (nextStatus === latest.status) return summaries;
      return { ...summaries, [room]: { ...summary, latestMessage: { ...latest, status: nextStatus } } };
    });
  }

  function handleMessageEdited(updatedMessage) {
    const normalized = normalizeSocketMessage(updatedMessage, currentUserId);
    if (!normalized) return;
    chat.setChatMessages((current) =>
      current.map((message) => message.id === normalized.id ? { ...message, ...normalized } : message),
    );
    unread.updateRoomLatestMessage(normalized);
  }

  function handleMessageDeleted({ id, room } = {}) {
    if (id) messages.removeMessageFromUi(String(id), room);
  }

  function handleMessageReactionsUpdated({
    messageId,
    room,
    reactions,
    reactionsUpdatedAt,
    activity,
  } = {}) {
    if (!messageId) return;
    const normalizedId = `socket-${messageId}`;
    const reactionState = {
      reactions: normalizeMessageReactions(reactions),
      reactionsUpdatedAt,
    };
    chat.setChatMessages((current) =>
      current.map((message) =>
        message.id === normalizedId
          ? {
              ...message,
              reactions: reactionState.reactions,
              reactionsUpdatedAt: reactionsUpdatedAt ?? message.reactionsUpdatedAt,
            }
          : message,
      ),
    );
    chat.setRoomSummaries((summaries) => {
      const summary = summaries[room] ?? { unreadCount: 0, latestMessage: null };
      let latestReaction = summary.latestReaction ?? null;
      const activityTime = new Date(activity?.createdAt || 0).getTime();
      const latestActivityTime = new Date(latestReaction?.createdAt || 0).getTime();
      if (
        activity?.action === "added" &&
        String(activity.targetSenderId) === String(currentUserId) &&
        String(activity.userId) !== String(currentUserId) &&
        activityTime >= latestActivityTime
      ) latestReaction = { ...activity, messageId: String(messageId) };
      else if (
        activity?.action === "removed" &&
        latestReaction?.messageId === String(messageId) &&
        latestReaction?.emoji === activity.emoji &&
        String(latestReaction?.userId) === String(activity.userId) &&
        activityTime >= latestActivityTime
      ) latestReaction = null;
      const latestMessage = summary.latestMessage?.id === normalizedId
        ? {
            ...summary.latestMessage,
            reactions: reactionState.reactions,
            reactionsUpdatedAt:
              reactionsUpdatedAt ?? summary.latestMessage.reactionsUpdatedAt,
          }
        : summary.latestMessage;
      if (latestMessage === summary.latestMessage && latestReaction === summary.latestReaction) return summaries;
      return { ...summaries, [room]: { ...summary, latestMessage, latestReaction } };
    });
  }

  return {
    message_deleted: handleMessageDeleted,
    message_edited: handleMessageEdited,
    message_notification: handleReceiveMessage,
    message_reactions_updated: handleMessageReactionsUpdated,
    message_status_update: handleMessageStatusUpdate,
    new_message: handleReceiveMessage,
  };
}
