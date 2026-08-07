import { useRef } from "react";

import {
  ensureDmConversation,
  setConversationDeletion,
} from "../../../api/userApi.js";
import { resolveUploadedFileUrl } from "../../../api/fileApi.js";
import { chats } from "../constants/chatConfig.js";
import { getDmRoomId, getUserInitials } from "../utils/conversation.js";

export default function useConversationSelection({
  chat,
  currentUserId,
  setActiveSection,
  setShowMobileChatList,
  unread,
  voiceRef,
}) {
  const ensuringDmRoomsRef = useRef(new Set());

  function resetComposer() {
    chat.setEditingMessage(null);
    chat.setReplyingTo(null);
    chat.setReactionDetailsMessageId(null);
    chat.setMessageValue("");
    voiceRef.current?.cancelVoiceRecording();
    chat.setSelectedFile(null);
    chat.setAttachmentError("");
  }

  function handleChatSelect(conversation, { preserveSearchTarget = false } = {}) {
    const room = conversation?.room;
    const recipientId = conversation?.recipientId ?? null;
    if (recipientId != null && String(recipientId) === String(currentUserId)) return;
    if (!room) return;
    setShowMobileChatList(false);
    if (room === chat.activeRoomRef.current) return;
    if (!preserveSearchTarget) chat.setSearchMessageTarget(null);

    chat.stopTyping();
    chat.setTypingSocketIds(new Set());
    chat.setActiveRoomMemberSocketIds(new Set());
    chat.setActiveRoomMembers([]);
    chat.seenEmissionIdsRef.current = new Set();
    chat.pendingActiveRoomSeenRef.current = room;
    chat.historyGenerationRef.current += 1;
    chat.oldestPageRef.current = null;
    chat.hasOlderMessagesRef.current = false;
    chat.olderRequestInFlightRef.current = false;
    chat.initialScrollPendingRef.current = false;
    chat.prependScrollSnapshotRef.current = null;
    chat.shouldAutoScrollNewMessageRef.current = false;
    chat.isNearBottomRef.current = true;
    chat.setLoadingOlderMessages(false);

    const socket = chat.socketRef.current;
    if (socket?.connected && chat.joinedRoomRef.current) {
      socket.emit("leave_room", { room: chat.joinedRoomRef.current });
      chat.joinedRoomRef.current = null;
    }
    chat.activeRoomRef.current = room;
    chat.activeDmRecipientIdRef.current = recipientId;
    if (socket?.connected) {
      socket.emit("join_room", { room });
      chat.joinedRoomRef.current = room;
    }
    chat.setActiveRoom(room);
    chat.setActiveDmRecipientId(recipientId);
    chat.setChatMessages([]);
    resetComposer();
  }

  function restoreDeletedConversation(room) {
    if (!room || !chat.deletedConversationRoomsRef.current.has(room)) return;
    chat.deletedConversationRoomsRef.current.delete(room);
    chat.setDeletedConversations((conversations) =>
      conversations.filter((conversation) => conversation.room !== room),
    );
    setConversationDeletion(room, false).catch((error) => {
      console.error("[conversation-deletions] restore_error", error.response?.data?.error ?? error.message);
    });
  }

  function clearConversationFromUi(conversation) {
    const room = conversation?.room;
    if (!room) return;
    chat.setPinnedConversations((items) => items.filter((item) => item.room !== room));
    chat.setRoomSummaries((summaries) => {
      const { [room]: removed, ...remaining } = summaries;
      return removed ? remaining : summaries;
    });
    chat.setChatMessages((messages) => messages.filter((message) => message.room !== room));
    chat.setReadNotificationIds((ids) => {
      const notificationId = `conversation:${room}`;
      if (!ids.has(notificationId)) return ids;
      const next = new Set(ids);
      next.delete(notificationId);
      return next;
    });
    if (conversation.recipientId) {
      chat.setDmConversationUserIds((ids) => {
        if (!ids.has(conversation.recipientId)) return ids;
        const next = new Set(ids);
        next.delete(conversation.recipientId);
        return next;
      });
    }
    if (chat.activeProfileChat?.room === room) chat.setActiveProfileChat(null);
    if (chat.activeRoomRef.current !== room) return;
    chat.stopTyping();
    const socket = chat.socketRef.current;
    if (socket?.connected && chat.joinedRoomRef.current === room) {
      socket.emit("leave_room", { room });
      chat.joinedRoomRef.current = null;
    }
    chat.activeRoomRef.current = null;
    chat.activeDmRecipientIdRef.current = null;
    chat.pendingActiveRoomSeenRef.current = null;
    chat.historyGenerationRef.current += 1;
    chat.setActiveRoom(null);
    chat.setActiveDmRecipientId(null);
    chat.setActiveRoomMembers([]);
    chat.setActiveRoomMemberSocketIds(new Set());
    chat.setTypingSocketIds(new Set());
    chat.setChatMessages([]);
    resetComposer();
  }

  function handleRequestDeleteConversation(conversation) {
    if (!conversation?.room) return;
    chat.setDeleteConversationError("");
    chat.setDeleteConfirmation(conversation);
  }

  async function handleConfirmDeleteConversation() {
    const conversation = chat.deleteConfirmation;
    if (!conversation?.room || chat.deletingConversation) return;
    chat.setDeletingConversation(true);
    chat.setDeleteConversationError("");
    try {
      const deletions = await setConversationDeletion(conversation.room, true);
      chat.deletedConversationRoomsRef.current.add(conversation.room);
      chat.setDeletedConversations(deletions);
      clearConversationFromUi(conversation);
      chat.setDeleteConfirmation(null);
    } catch (error) {
      chat.setDeleteConversationError(error.response?.data?.error ?? error.message ?? "Unable to delete this conversation.");
    } finally {
      chat.setDeletingConversation(false);
    }
  }

  function handleMessageUser(conversation, options = {}) {
    const recipientId = conversation?.recipientId;
    if (recipientId == null || String(recipientId) === String(currentUserId)) return;
    const normalizedId = String(recipientId);
    const room = conversation.room ?? getDmRoomId(currentUserId, normalizedId);
    const conversationAlreadyExists = chat.dmConversationUserIds.has(normalizedId);
    restoreDeletedConversation(room);
    chat.setAvailableDmUsers((users) =>
      users.some((user) => user.userId === normalizedId)
        ? users
        : [...users, { userId: normalizedId, username: conversation.username || conversation.name || "User", displayName: conversation.username ? conversation.name || "" : "", profileImage: conversation.imageSrc || "" }],
    );
    chat.setDmConversationUserIds((ids) => {
      if (ids.has(normalizedId)) return ids;
      const next = new Set(ids);
      next.add(normalizedId);
      return next;
    });
    setActiveSection("dms");
    handleChatSelect({ ...conversation, room, recipientId: normalizedId }, options);
    if (!conversationAlreadyExists && !ensuringDmRoomsRef.current.has(room)) {
      ensuringDmRoomsRef.current.add(room);
      ensureDmConversation(normalizedId)
        .then((savedConversation) => {
          if (!savedConversation) return;
          chat.setAvailableDmUsers((users) =>
            users.map((user) =>
              user.userId === normalizedId
                ? {
                    ...user,
                    username: savedConversation.username || user.username,
                    displayName: savedConversation.displayName ?? user.displayName,
                    bio: savedConversation.bio ?? user.bio,
                    profileImage: savedConversation.profileImage ?? user.profileImage,
                  }
                : user,
            ),
          );
        })
        .catch((error) => {
          ensuringDmRoomsRef.current.delete(room);
          chat.setAttachmentError(
            error.response?.data?.error ??
              error.message ??
              "Unable to start this conversation.",
          );
        });
    }
  }

  function handleOpenSearchConversation(result, options = {}) {
    if (result?.type === "dm") {
      handleMessageUser({ recipientId: result.recipientId, name: result.name, imageSrc: resolveUploadedFileUrl(result.profileImage), room: result.room }, options);
      return;
    }
    if (!result?.room) return;
    const existing = chats.find((candidate) => candidate.room === result.room);
    const conversation = { id: `search-room-${result.room}`, room: result.room, name: existing?.name || "Room", initials: getUserInitials(existing?.name || "Room"), preview: "", time: "", group: true, tone: "bg-[#ECE8F3] text-[#65567B] dark:bg-[#373141] dark:text-[#D8CBE7]" };
    chat.setSearchRoomChats((items) => items.some((item) => item.room === conversation.room) ? items : [...items, conversation]);
    setActiveSection("rooms");
    handleChatSelect(conversation, options);
  }

  function handleOpenSearchUser(result) {
    handleMessageUser({ recipientId: result?.userId, name: result?.username || "User", imageSrc: resolveUploadedFileUrl(result?.profileImage) });
  }

  function handleOpenSearchMessage(message) {
    const conversation = message?.conversation;
    if (!conversation?.room || !message?._id || !message.historyPage) return;
    chat.setSearchMessageTarget({ room: conversation.room, messageId: String(message._id), historyPage: message.historyPage });
    handleOpenSearchConversation(conversation, { preserveSearchTarget: true });
  }

  function handleOpenNotification(notification) {
    chat.setReadNotificationIds((ids) => new Set(ids).add(notification.id));
    if (notification.type === "friend_request" || notification.type === "friend_request_accepted") {
      chat.setFriendsInitialTab(notification.type === "friend_request" ? "incoming" : "friends");
      setActiveSection("friends");
      return;
    }
    const conversation = notification.chat;
    if (!conversation?.room) return;
    if (conversation.room === chat.activeRoomRef.current) {
      chat.socketRef.current?.emit("mark_seen", { room: conversation.room });
      unread.clearRoomUnread(conversation.room);
    }
    if (notification.type === "dm_message") handleMessageUser(conversation);
    else {
      setActiveSection("rooms");
      handleChatSelect(conversation);
    }
  }

  return {
    clearConversationFromUi,
    handleChatSelect,
    handleConfirmDeleteConversation,
    handleMessageUser,
    handleOpenNotification,
    handleOpenSearchConversation,
    handleOpenSearchMessage,
    handleOpenSearchUser,
    handleRequestDeleteConversation,
    restoreDeletedConversation,
  };
}
