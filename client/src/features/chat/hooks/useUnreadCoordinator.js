/* eslint-disable react-hooks/exhaustive-deps, react-hooks/immutability */
import { useEffect } from "react";

import {
  getNewestReactionState,
  isLaterMessage,
  latestMessageStatus,
} from "../utils/message.js";

export default function useUnreadCoordinator({ chat, currentUserId }) {
  function updateRoomLatestMessage(message) {
    if (!message?.room) return;
    chat.setRoomSummaries((currentSummaries) => {
      const summary = currentSummaries[message.room] ?? {
        unreadCount: 0,
        latestMessage: null,
      };
      if (!isLaterMessage(message, summary.latestMessage)) return currentSummaries;
      const latestMessage =
        summary.latestMessage?.id === message.id
          ? {
              ...message,
              status: latestMessageStatus(summary.latestMessage.status, message.status),
              ...getNewestReactionState(message, summary.latestMessage),
            }
          : message;
      return {
        ...currentSummaries,
        [message.room]: { ...summary, latestMessage },
      };
    });
  }

  function incrementRoomUnread(room) {
    if (!room) return;
    chat.setRoomSummaries((currentSummaries) => {
      const summary = currentSummaries[room] ?? {
        unreadCount: 0,
        latestMessage: null,
      };
      const count = Number(summary.unreadCount);
      return {
        ...currentSummaries,
        [room]: {
          ...summary,
          unreadCount: Number.isFinite(count) ? Math.max(0, Math.floor(count)) + 1 : 1,
        },
      };
    });
  }

  function clearRoomUnread(room) {
    if (!room) return;
    chat.setRoomSummaries((currentSummaries) => {
      const summary = currentSummaries[room];
      if (!summary || Number(summary.unreadCount) === 0) return currentSummaries;
      return {
        ...currentSummaries,
        [room]: { ...summary, unreadCount: 0 },
      };
    });
  }

  function markVisibleMessagesSeen() {
    const socket = chat.socketRef.current;
    const container = chat.messagesScrollRef.current;
    if (
      !chat.pageVisible ||
      !chat.socketConnected ||
      !socket?.connected ||
      !container ||
      chat.joinedRoomRef.current !== chat.activeRoom
    ) return;

    const incomingIds = new Set(
      chat.chatMessages
        .filter(
          (message) =>
            String(message.room) === String(chat.activeRoom) &&
            message.direction === "incoming" &&
            message.senderId != null &&
            String(message.senderId) !== String(currentUserId),
        )
        .map((message) => message.id),
    );
    if (incomingIds.size === 0) return;
    const containerBounds = container.getBoundingClientRect();
    const visibleIds = Array.from(container.querySelectorAll("[data-message-id]"))
      .filter((element) => {
        const bounds = element.getBoundingClientRect();
        return bounds.bottom > containerBounds.top && bounds.top < containerBounds.bottom;
      })
      .map((element) => element.dataset.messageId)
      .filter((messageId) => incomingIds.has(messageId));
    if (visibleIds.length === 0) return;

    clearRoomUnread(chat.activeRoom);
    const unseenIds = visibleIds.filter((messageId) => {
      const message = chat.chatMessages.find((item) => item.id === messageId);
      return message?.status !== "seen" && !chat.seenEmissionIdsRef.current.has(messageId);
    });
    if (unseenIds.length === 0) return;
    unseenIds.forEach((messageId) => chat.seenEmissionIdsRef.current.add(messageId));
    socket.emit("mark_seen", { room: chat.activeRoom });
  }

  useEffect(() => {
    function handleVisibilityChange() {
      chat.setPageVisible(document.visibilityState === "visible");
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [chat.setPageVisible]);

  useEffect(() => {
    const interval = setInterval(() => chat.setRelativeTimeNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, [chat.setRelativeTimeNow]);

  useEffect(() => {
    const room = chat.pendingActiveRoomSeenRef.current;
    const socket = chat.socketRef.current;
    if (
      room !== chat.activeRoom ||
      !chat.socketConnected ||
      !socket?.connected ||
      chat.joinedRoomRef.current !== room
    ) return;
    const count = Math.max(0, Number(chat.roomSummaries?.[room]?.unreadCount) || 0);
    chat.pendingActiveRoomSeenRef.current = null;
    if (count > 0) {
      socket.emit("mark_seen", { room });
      clearRoomUnread(room);
    }
  }, [chat.activeRoom, chat.roomSummaries, chat.socketConnected]);

  useEffect(() => {
    markVisibleMessagesSeen();
  }, [chat.activeRoom, chat.chatMessages, chat.pageVisible, chat.socketConnected]);

  return {
    clearRoomUnread,
    incrementRoomUnread,
    markVisibleMessagesSeen,
    updateRoomLatestMessage,
  };
}
