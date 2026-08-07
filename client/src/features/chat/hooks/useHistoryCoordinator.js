/* eslint-disable react-hooks/exhaustive-deps, react-hooks/immutability */
import { useEffect, useLayoutEffect } from "react";

import {
  getPrivateMessagePage,
  getRoomMessagePage,
} from "../../../api/messageApi.js";
import { dedupeRequest } from "../../../api/requestDedup.js";
import {
  getNewestReactionState,
  latestMessageStatus,
  normalizeSocketMessage,
} from "../utils/message.js";

export default function useHistoryCoordinator({ chat, currentUserId, unread }) {
  useEffect(() => {
    if (!chat.activeRoom) return undefined;
    let cancelled = false;
    const generation = chat.historyGenerationRef.current + 1;
    chat.historyGenerationRef.current = generation;
    chat.oldestPageRef.current = null;
    chat.hasOlderMessagesRef.current = false;
    chat.olderRequestInFlightRef.current = false;
    chat.isNearBottomRef.current = true;
    chat.programmaticScrollTopRef.current = null;
    chat.previousScrollTopRef.current = null;
    chat.setLoadingOlderMessages(false);

    async function loadHistory() {
      try {
        const targetPage =
          chat.searchMessageTarget?.room === chat.activeRoom
            ? chat.searchMessageTarget.historyPage
            : null;
        const room = chat.activeRoom;
        const recipientId = chat.activeDmRecipientId;
        const historyKey = recipientId ? `dm:${recipientId}` : `room:${room}`;
        const page = await dedupeRequest(
          `chat:history:${historyKey}:${targetPage ?? 1}`,
          () =>
            recipientId
              ? getPrivateMessagePage(recipientId, targetPage ?? 1)
              : getRoomMessagePage(room, targetPage ?? 1),
        );
        if (cancelled || generation !== chat.historyGenerationRef.current) return;
        const history = page.messages
          .map((message) => normalizeSocketMessage(message, currentUserId))
          .filter(
            (message) =>
              message &&
              String(message.room) === String(chat.activeRoom) &&
              !chat.hiddenMessageIdsRef.current.has(message.backendId),
          );
        if (history.length > 0) unread.updateRoomLatestMessage(history.at(-1));
        chat.oldestPageRef.current = page.page;
        chat.hasOlderMessagesRef.current = page.hasMore;
        chat.initialScrollPendingRef.current = !targetPage;
        chat.setChatMessages((currentMessages) => {
          const merged = [...history];
          currentMessages
            .filter((message) => String(message.room) === String(chat.activeRoom))
            .forEach((message) => {
              const index = merged.findIndex((candidate) => candidate.id === message.id);
              if (index === -1) merged.push(message);
              else {
                const existing = merged[index];
                merged[index] = {
                  ...existing,
                  status: latestMessageStatus(existing.status, message.status),
                  ...getNewestReactionState(existing, message),
                };
              }
            });
          return merged;
        });
      } catch (error) {
        if (!cancelled && generation === chat.historyGenerationRef.current && error.code !== "ERR_CANCELED") {
          console.error("[rooms] history_error", error.response?.data?.message ?? error.message);
        }
      }
    }
    void loadHistory();
    return () => { cancelled = true; };
  }, [chat.activeDmRecipientId, chat.activeRoom, currentUserId, chat.searchMessageTarget]);

  async function loadOlderMessages() {
    const currentPage = chat.oldestPageRef.current;
    if (
      chat.olderRequestInFlightRef.current ||
      !chat.hasOlderMessagesRef.current ||
      currentPage === null
    ) return;
    const room = chat.activeRoomRef.current;
    const pageNumber = currentPage + 1;
    const generation = chat.historyGenerationRef.current;
    chat.olderRequestInFlightRef.current = true;
    chat.setLoadingOlderMessages(true);
    try {
      const recipientId = chat.activeDmRecipientIdRef.current;
      const historyKey = recipientId ? `dm:${recipientId}` : `room:${room}`;
      const page = await dedupeRequest(
        `chat:history:${historyKey}:${pageNumber}`,
        () =>
          recipientId
            ? getPrivateMessagePage(recipientId, pageNumber)
            : getRoomMessagePage(room, pageNumber),
      );
      if (generation !== chat.historyGenerationRef.current || room !== chat.activeRoomRef.current) return;
      const older = page.messages
        .map((message) => normalizeSocketMessage(message, currentUserId))
        .filter(
          (message) =>
            message &&
            String(message.room) === String(room) &&
            !chat.hiddenMessageIdsRef.current.has(message.backendId),
        );
      chat.oldestPageRef.current = pageNumber;
      chat.hasOlderMessagesRef.current = page.hasMore;
      chat.setChatMessages((currentMessages) => {
        const ids = new Set(currentMessages.map((message) => message.id));
        const unique = older.filter((message) => !ids.has(message.id));
        if (unique.length === 0) return currentMessages;
        const container = chat.messagesScrollRef.current;
        if (container) {
          chat.prependScrollSnapshotRef.current = {
            scrollHeight: container.scrollHeight,
            scrollTop: container.scrollTop,
          };
        }
        return [...unique, ...currentMessages];
      });
    } catch (error) {
      if (generation === chat.historyGenerationRef.current) {
        console.error("[rooms] older_history_error", error.response?.data?.message ?? error.message);
      }
    } finally {
      if (generation === chat.historyGenerationRef.current) {
        chat.olderRequestInFlightRef.current = false;
        chat.setLoadingOlderMessages(false);
      }
    }
  }

  function handleMessagesScroll(event) {
    const container = event.currentTarget;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    chat.isNearBottomRef.current = distanceFromBottom < 120;
    const programmaticScrollTop = chat.programmaticScrollTopRef.current;
    const previousScrollTop = chat.previousScrollTopRef.current;
    chat.previousScrollTopRef.current = container.scrollTop;
    if (
      programmaticScrollTop !== null &&
      Math.abs(container.scrollTop - programmaticScrollTop) < 1
    ) {
      chat.programmaticScrollTopRef.current = null;
    } else {
      chat.programmaticScrollTopRef.current = null;
      if (
        previousScrollTop !== null &&
        container.scrollTop < previousScrollTop &&
        container.scrollTop < 120
      ) {
        void loadOlderMessages();
      }
    }
    unread.markVisibleMessagesSeen();
  }

  useLayoutEffect(() => {
    const container = chat.messagesScrollRef.current;
    if (!container) return;
    const typingStarted = chat.typingSocketIds.size > 0 && !chat.wasTypingRef.current;
    chat.wasTypingRef.current = chat.typingSocketIds.size > 0;
    if (chat.initialScrollPendingRef.current) {
      chat.initialScrollPendingRef.current = false;
      container.scrollTop = container.scrollHeight;
      chat.programmaticScrollTopRef.current = container.scrollTop;
      chat.previousScrollTopRef.current = container.scrollTop;
      chat.isNearBottomRef.current = true;
      return;
    }
    if (chat.prependScrollSnapshotRef.current) {
      const { scrollHeight, scrollTop } = chat.prependScrollSnapshotRef.current;
      chat.prependScrollSnapshotRef.current = null;
      container.scrollTop = scrollTop + (container.scrollHeight - scrollHeight);
      chat.programmaticScrollTopRef.current = container.scrollTop;
      chat.previousScrollTopRef.current = container.scrollTop;
      return;
    }
    if (
      chat.shouldAutoScrollNewMessageRef.current ||
      (typingStarted && chat.isNearBottomRef.current)
    ) {
      chat.shouldAutoScrollNewMessageRef.current = false;
      chat.messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat.chatMessages, chat.typingSocketIds]);

  return { handleMessagesScroll, loadOlderMessages };
}
