import { deleteMessage, editMessage } from "../../../api/messageApi.js";
import { uploadFile } from "../../../api/fileApi.js";
import { ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE } from "../constants/chatConfig.js";
import { saveHiddenMessageIds } from "../utils/hiddenMessages.js";
import { canEditMessage, normalizeSocketMessage } from "../utils/message.js";

export default function useMessageCoordinator({ chat, currentUserId, unread, voiceRef }) {
  function cancelVoiceRecording() {
    voiceRef.current?.cancelVoiceRecording();
  }

  function removeMessageFromUi(backendId, room) {
    const normalizedId = `socket-${backendId}`;
    chat.setChatMessages((currentMessages) => {
      const removed = currentMessages.find((message) => message.id === normalizedId);
      const remaining = currentMessages.filter((message) => message.id !== normalizedId);
      if (removed) {
        const targetRoom = room || removed.room;
        const latestRemaining = [...remaining].reverse().find((message) => message.room === targetRoom);
        chat.setRoomSummaries((currentSummaries) => {
          const summary = currentSummaries[targetRoom];
          const removesLatest = summary?.latestMessage?.id === normalizedId;
          const removesReaction = summary?.latestReaction?.messageId === String(backendId);
          if (!removesLatest && !removesReaction) return currentSummaries;
          return {
            ...currentSummaries,
            [targetRoom]: {
              ...summary,
              latestMessage: removesLatest ? latestRemaining || null : summary.latestMessage,
              latestReaction: removesReaction ? null : summary.latestReaction,
            },
          };
        });
      }
      return remaining;
    });
    chat.setEditingMessage((message) =>
      message?.backendId === backendId ? null : message,
    );
    chat.setReplyingTo((message) =>
      message?.backendId === backendId ? null : message,
    );
  }

  function handleFileSelect(file) {
    cancelVoiceRecording();
    chat.setAttachmentError("");
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      chat.setSelectedFile(null);
      chat.setAttachmentError("This file type is not supported.");
      return;
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      chat.setSelectedFile(null);
      chat.setAttachmentError("Files must be 10 MB or smaller.");
      return;
    }
    chat.setSelectedFile(file);
  }

  function handleFileRemove() {
    if (chat.sendInFlightRef.current) return;
    chat.setSelectedFile(null);
    chat.setAttachmentError("");
  }

  function handleCancelEditingMessage() {
    chat.setEditingMessage(null);
    chat.setMessageValue("");
    chat.setAttachmentError("");
  }

  function handleStartEditingMessage(message) {
    if (!canEditMessage(message)) return;
    cancelVoiceRecording();
    chat.setReplyingTo(null);
    chat.setSelectedFile(null);
    chat.setAttachmentError("");
    chat.setEditingMessage(message);
    chat.setMessageValue(message.text);
  }

  function handleStartReplyingToMessage(message) {
    if (!message?.backendId) return;
    cancelVoiceRecording();
    if (chat.editingMessage) chat.setMessageValue("");
    chat.setEditingMessage(null);
    chat.setReplyingTo(message);
    chat.setAttachmentError("");
  }

  function handleCancelReply() {
    chat.setReplyingTo(null);
    chat.setAttachmentError("");
  }

  function handleReactToMessage(message, emoji, action = "set") {
    const socket = chat.socketRef.current;
    if (!socket?.connected || !message?.backendId || !message.room) {
      chat.setAttachmentError("Unable to react while disconnected.");
      return;
    }
    chat.setAttachmentError("");
    socket.emit("toggle_message_reaction", {
      room: message.room,
      messageId: message.backendId,
      emoji,
      action,
    });
  }

  function handleDeleteMessageForMe(message) {
    if (message?.direction !== "outgoing" || !message.backendId) return;
    const ids = new Set(chat.hiddenMessageIdsRef.current);
    ids.add(String(message.backendId));
    chat.hiddenMessageIdsRef.current = ids;
    saveHiddenMessageIds(currentUserId, ids);
    if (chat.editingMessage?.backendId === message.backendId) {
      handleCancelEditingMessage();
    }
    removeMessageFromUi(String(message.backendId), message.room);
  }

  async function handleDeleteMessageForEveryone(message) {
    if (message?.direction !== "outgoing" || !message.backendId) return;
    chat.setAttachmentError("");
    try {
      await deleteMessage(message.backendId);
      if (chat.editingMessage?.backendId === message.backendId) {
        handleCancelEditingMessage();
      }
      removeMessageFromUi(String(message.backendId), message.room);
    } catch (error) {
      chat.setAttachmentError(error.response?.data?.error ?? error.message ?? "Unable to delete message.");
    }
  }

  async function handleMessageSend(value, options = {}) {
    const text = value?.trim();
    const socket = chat.socketRef.current;
    const file = options.file ?? chat.selectedFile;
    const voice = options.voice === true;
    if ((!text && !file) || chat.sendInFlightRef.current) return;

    if (chat.editingMessage) {
      if (!text) return;
      chat.sendInFlightRef.current = true;
      chat.setSendingMessage(true);
      chat.setAttachmentError("");
      try {
        const updated = await editMessage(chat.editingMessage.backendId, text);
        const normalized = normalizeSocketMessage(updated, currentUserId);
        chat.setChatMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === chat.editingMessage.id ? { ...message, ...normalized } : message,
          ),
        );
        if (normalized) unread.updateRoomLatestMessage(normalized);
        chat.setEditingMessage(null);
        chat.setMessageValue("");
      } catch (error) {
        chat.setAttachmentError(error.response?.data?.error ?? error.message ?? "Unable to edit message.");
      } finally {
        chat.sendInFlightRef.current = false;
        chat.setSendingMessage(false);
      }
      return;
    }

    if (!socket?.connected) {
      if (voice) cancelVoiceRecording();
      chat.setAttachmentError("Unable to send while disconnected.");
      return;
    }
    chat.stopTyping();
    chat.sendInFlightRef.current = true;
    chat.setSendingMessage(true);
    chat.setAttachmentError("");
    const room = chat.activeRoomRef.current;
    try {
      let attachment;
      if (file) {
        const uploaded = await uploadFile(file);
        if (!uploaded?.url) throw new Error("Upload response did not include a file URL.");
        attachment = {
          fileUrl: uploaded.url,
          fileName: uploaded.originalName,
          mimeType: uploaded.mimeType,
        };
      }
      if (!socket.connected || chat.activeRoomRef.current !== room) {
        throw new Error("The active room changed before the message was sent.");
      }
      const recipientId = chat.activeDmRecipientIdRef.current;
      const replyToMessageId = chat.replyingTo?.backendId;
      const payload = recipientId
        ? { recipientId, ...(text ? { message: text } : {}), ...(attachment ? { attachment } : {}), ...(replyToMessageId ? { replyToMessageId } : {}) }
        : { room, ...(text ? { message: text } : {}), ...(attachment ? { attachment } : {}), ...(replyToMessageId ? { replyToMessageId } : {}) };
      socket.emit(recipientId ? "send_private_message" : "send_message", payload);
      chat.setMessageValue("");
      chat.setSelectedFile(null);
      chat.setReplyingTo(null);
      if (voice) cancelVoiceRecording();
    } catch (error) {
      if (voice) cancelVoiceRecording();
      chat.setAttachmentError(error.response?.data?.message ?? error.message ?? "Unable to send the attachment.");
    } finally {
      chat.sendInFlightRef.current = false;
      chat.setSendingMessage(false);
    }
  }

  return {
    handleCancelEditingMessage,
    handleCancelReply,
    handleDeleteMessageForEveryone,
    handleDeleteMessageForMe,
    handleFileRemove,
    handleFileSelect,
    handleMessageSend,
    handleReactToMessage,
    handleStartEditingMessage,
    handleStartReplyingToMessage,
    removeMessageFromUi,
  };
}
