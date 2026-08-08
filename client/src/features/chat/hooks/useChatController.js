import { useEffect, useRef, useState } from "react";

import { resolveUploadedFileUrl } from "../../../api/fileApi.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import TransportManager from "../../../transports/TransportManager.js";
import useChatBootstrap from "./useChatBootstrap.js";
import useChatDerivedState from "./useChatDerivedState.js";
import useChatState from "./useChatState.js";
import useConversationSelection from "./useConversationSelection.js";
import useHistoryCoordinator from "./useHistoryCoordinator.js";
import useMessageCoordinator from "./useMessageCoordinator.js";
import useMessageSocketEvents from "./useMessageSocketEvents.js";
import usePageNavigation from "./usePageNavigation.js";
import usePresenceSocketEvents from "./usePresenceSocketEvents.js";
import useSocketLifecycle from "./useSocketLifecycle.js";
import useUnreadCoordinator from "./useUnreadCoordinator.js";
import useVoiceRecorder from "./useVoiceRecorder.js";

export default function useChatController() {
  const { user, logout, updateAuthenticatedUser } = useAuth();
  const currentUserId = user?._id ?? user?.id;
  const [loggingOut, setLoggingOut] = useState(false);
  const [transport] = useState(() => new TransportManager());
  const chat = useChatState({ currentUserId, transport });
  const navigation = usePageNavigation({ chat, currentUserId, transport });
  const unread = useUnreadCoordinator({ chat, currentUserId, transport });
  const voiceRef = useRef(null);
  const messageCoordinator = useMessageCoordinator({
    chat,
    currentUserId,
    transport,
    unread,
    voiceRef,
  });
  const voice = useVoiceRecorder({
    sendInFlightRef: chat.sendInFlightRef,
    setAttachmentError: chat.setAttachmentError,
    setSelectedFile: chat.setSelectedFile,
    onSend: messageCoordinator.handleMessageSend,
  });
  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);
  const selection = useConversationSelection({
    chat,
    currentUserId,
    transport,
    setActiveSection: navigation.setActiveSection,
    setShowMobileChatList: navigation.setShowMobileChatList,
    unread,
    voiceRef,
  });
  const derived = useChatDerivedState({
    activeSection: navigation.activeSection,
    currentUserId,
    chat,
  });
  const history = useHistoryCoordinator({ chat, currentUserId, unread });

  useChatBootstrap({ chat, currentUserId, selection });
  const messageEvents = useMessageSocketEvents({
    chat,
    currentUserId,
    messages: messageCoordinator,
    selection,
    unread,
  });
  const presenceEvents = usePresenceSocketEvents({ chat, currentUserId, transport });
  useSocketLifecycle({
    chat,
    currentUserId,
    events: { ...messageEvents, ...presenceEvents },
    transport,
  });

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  const profileName = user?.username || user?.email || "You";
  const reactionDetailsMessage = chat.chatMessages.find(
    (message) => message.id === chat.reactionDetailsMessageId,
  );

  return {
    ...chat,
    ...derived,
    ...history,
    ...messageCoordinator,
    ...navigation,
    ...selection,
    ...voice,
    currentUserId,
    handleLogout,
    loggingOut,
    profileInitials: profileName.slice(0, 2).toUpperCase(),
    reactionDetailsMessage,
    resolveUploadedFileUrl,
    updateAuthenticatedUser,
    user,
  };
}
