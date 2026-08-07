import { useEffect, useRef, useState } from "react";

import { loadNotificationPreferences } from "../../../utils/notificationPreferences.js";
import { dedupeRequest } from "../../../api/requestDedup.js";
import {
  getConversationArchives,
  getConversationMutes,
  getConversationPins,
  setConversationArchive,
  setConversationMute,
  setConversationPin,
} from "../../../api/userApi.js";
import { isConversationMuted } from "../utils/conversation.js";

export default function useConversationPreferences({ currentUserId, now }) {
  const [notificationPreferences, setNotificationPreferences] = useState(
    loadNotificationPreferences,
  );
  const [pinnedConversations, setPinnedConversations] = useState([]);
  const [deletedConversations, setDeletedConversations] = useState([]);
  const [mutedConversations, setMutedConversations] = useState([]);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [muteConfirmation, setMuteConfirmation] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [deleteConversationError, setDeleteConversationError] = useState("");
  const deletedConversationRoomsRef = useRef(new Set());
  const preferenceInFlightRoomsRef = useRef(new Set());

  function beginPreferenceRequest(room) {
    if (!room || preferenceInFlightRoomsRef.current.has(room)) return false;
    preferenceInFlightRoomsRef.current.add(room);
    return true;
  }

  function endPreferenceRequest(room) {
    preferenceInFlightRoomsRef.current.delete(room);
  }

  useEffect(() => {
    if (!currentUserId) return undefined;
    let cancelled = false;
    dedupeRequest(
      `chat:pins:${currentUserId}`,
      () => getConversationPins(),
    )
      .then((pins) => {
        if (!cancelled) setPinnedConversations(pins);
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") {
          console.error("[conversation-pins] load_error", error.response?.data?.error ?? error.message);
        }
      });
    return () => { cancelled = true; };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return undefined;
    let cancelled = false;
    dedupeRequest(
      `chat:archives:${currentUserId}`,
      () => getConversationArchives(),
    )
      .then((conversations) => {
        if (!cancelled) setArchivedConversations(conversations);
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") {
          console.error("[conversation-archives] load_error", error.response?.data?.error ?? error.message);
        }
      });
    return () => { cancelled = true; };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return undefined;
    let cancelled = false;
    dedupeRequest(
      `chat:mutes:${currentUserId}`,
      () => getConversationMutes(),
    )
      .then((conversations) => {
        if (!cancelled) setMutedConversations(conversations);
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") {
          console.error("[conversation-mutes] load_error", error.response?.data?.error ?? error.message);
        }
      });
    return () => { cancelled = true; };
  }, [currentUserId]);

  useEffect(() => {
    const currentTime = Date.now();
    const nextExpiry = mutedConversations
      .map((conversation) => new Date(conversation.mutedUntil).getTime())
      .filter((mutedUntil) => Number.isFinite(mutedUntil) && mutedUntil > currentTime)
      .sort((first, second) => first - second)[0];
    if (!nextExpiry) return undefined;

    const timeout = setTimeout(() => {
      const expiredRooms = mutedConversations
        .filter((conversation) => conversation.mutedUntil && new Date(conversation.mutedUntil).getTime() <= Date.now())
        .map((conversation) => conversation.room);
      if (expiredRooms.length === 0) return;
      setMutedConversations((current) => current.filter((conversation) => !expiredRooms.includes(conversation.room)));
      expiredRooms.forEach((room) => {
        setConversationMute(room, false).catch((error) => {
          console.error("[conversation-mutes] expiry_error", error.response?.data?.error ?? error.message);
        });
      });
    }, Math.max(0, nextExpiry - currentTime) + 50);
    return () => clearTimeout(timeout);
  }, [mutedConversations]);

  const mutedByRoom = new Map(
    mutedConversations.map((conversation) => [conversation.room, conversation]),
  );
  const isMuted = (room) => isConversationMuted(mutedByRoom.get(room), now);

  async function togglePin(room) {
    if (!beginPreferenceRequest(room)) return;
    const pinned = pinnedConversations.some((conversation) => conversation.room === room);
    try {
      const saved = await setConversationPin(room, !pinned);
      setPinnedConversations(saved);
      return saved;
    } catch (error) {
      console.error("[conversation-pins] update_error", error.response?.data?.error ?? error.message);
      throw error;
    } finally {
      endPreferenceRequest(room);
    }
  }

  async function requestMute(chat) {
    if (!chat?.room) return;
    if (!isMuted(chat.room)) {
      setMuteConfirmation(chat);
      return;
    }
    if (!beginPreferenceRequest(chat.room)) return;
    try {
      setMutedConversations(await setConversationMute(chat.room, false));
    } catch (error) {
      console.error("[conversation-mutes] update_error", error.response?.data?.error ?? error.message);
    } finally {
      endPreferenceRequest(chat.room);
    }
  }

  async function setMuteDuration(duration) {
    const chat = muteConfirmation;
    if (!chat?.room || !beginPreferenceRequest(chat.room)) return;
    try {
      setMutedConversations(await setConversationMute(chat.room, true, duration));
      setMuteConfirmation(null);
    } catch (error) {
      console.error("[conversation-mutes] update_error", error.response?.data?.error ?? error.message);
    } finally {
      endPreferenceRequest(chat.room);
    }
  }

  async function toggleArchive(chat) {
    if (!chat?.room || !beginPreferenceRequest(chat.room)) return;
    const archived = archivedConversations.some((conversation) => conversation.room === chat.room);
    try {
      const saved = await setConversationArchive(chat.room, !archived);
      setArchivedConversations(saved);
      return saved;
    } catch (error) {
      console.error("[conversation-archives] update_error", error.response?.data?.error ?? error.message);
      throw error;
    } finally {
      endPreferenceRequest(chat.room);
    }
  }

  return {
    notificationPreferences,
    setNotificationPreferences,
    pinnedConversations,
    setPinnedConversations,
    deletedConversations,
    setDeletedConversations,
    mutedConversations,
    setMutedConversations,
    archivedConversations,
    setArchivedConversations,
    muteConfirmation,
    setMuteConfirmation,
    deleteConfirmation,
    setDeleteConfirmation,
    deletingConversation,
    setDeletingConversation,
    deleteConversationError,
    setDeleteConversationError,
    deletedConversationRoomsRef,
    isMutedConversation: isMuted,
    handleToggleConversationPin: togglePin,
    handleRequestMuteConversation: requestMute,
    handleMuteDuration: setMuteDuration,
    handleToggleConversationArchive: toggleArchive,
  };
}
