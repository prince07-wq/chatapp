/* eslint-disable react-hooks/exhaustive-deps, react-hooks/immutability */
import { useEffect } from "react";

import {
  getConversationDeletions,
  getDmConversations,
  getFriends,
} from "../../../api/userApi.js";
import { dedupeRequest } from "../../../api/requestDedup.js";
import { loadHiddenMessageIds } from "../utils/hiddenMessages.js";

function normalizeUser(user) {
  return {
    userId: String(user.userId),
    username: user.username || "User",
    displayName: user.displayName || "",
    bio: user.bio || "",
    profileImage: user.profileImage || "",
  };
}

export default function useChatBootstrap({ chat, currentUserId, selection }) {
  useEffect(() => {
    chat.hiddenMessageIdsRef.current = loadHiddenMessageIds(currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    chat.deletedConversationRoomsRef.current = new Set(
      chat.deletedConversations.map((conversation) => conversation.room),
    );
  }, [chat.deletedConversations]);

  useEffect(() => {
    if (!currentUserId) return undefined;
    let cancelled = false;
    dedupeRequest(
      `chat:deletions:${currentUserId}`,
      () => getConversationDeletions(),
    )
      .then((conversations) => {
        if (cancelled) return;
        chat.setDeletedConversations(conversations);
        const activeDeleted = conversations.find(
          (conversation) => conversation.room === chat.activeRoomRef.current,
        );
        if (activeDeleted) selection.clearConversationFromUi(activeDeleted);
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") {
          console.error("[conversation-deletions] load_error", error.response?.data?.error ?? error.message);
        }
      });
    return () => { cancelled = true; };
  }, [currentUserId]);

  useEffect(() => {
    const pinnedDmUsers = chat.pinnedConversations.filter(
      (conversation) => conversation.recipientId,
    );
    if (pinnedDmUsers.length === 0) return undefined;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      chat.setAvailableDmUsers((users) => {
        const byId = new Map(users.map((user) => [String(user.userId), user]));
        pinnedDmUsers.forEach((conversation) => {
          const recipientId = String(conversation.recipientId);
          if (!byId.has(recipientId)) {
            byId.set(recipientId, {
              userId: recipientId,
              username: conversation.username || "User",
              displayName: conversation.displayName || "",
              bio: conversation.bio || "",
              profileImage: conversation.profileImage || "",
            });
          }
        });
        return Array.from(byId.values());
      });
      chat.setDmConversationUserIds((ids) => {
        const next = new Set(ids);
        pinnedDmUsers.forEach((conversation) => next.add(String(conversation.recipientId)));
        return next.size === ids.size ? ids : next;
      });
    });
    return () => { cancelled = true; };
  }, [chat.pinnedConversations]);

  useEffect(() => {
    if (!currentUserId) return undefined;
    let cancelled = false;
    chat.setLoadingDmUsers(true);
    chat.setDmUsersError("");
    dedupeRequest(
      `chat:dms:${currentUserId}`,
      () => getDmConversations(),
    )
      .then((conversations) => {
        if (cancelled) return;
        const persistedUsers = conversations.map((conversation) =>
          normalizeUser({
            ...conversation,
            userId: conversation.recipientId,
          }),
        );
        chat.setAvailableDmUsers((current) =>
          Array.from(
            new Map(
              [...current, ...persistedUsers].map((user) => [
                String(user.userId),
                user,
              ]),
            ).values(),
          ),
        );
        chat.setDmConversationUserIds((currentIds) => {
          const nextIds = new Set(currentIds);
          conversations.forEach((conversation) =>
            nextIds.add(String(conversation.recipientId)),
          );
          return nextIds.size === currentIds.size ? currentIds : nextIds;
        });
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") {
          chat.setDmUsersError(error.response?.data?.message ?? "Unable to load direct messages.");
        }
      })
      .finally(() => {
        if (!cancelled) chat.setLoadingDmUsers(false);
      });
    return () => { cancelled = true; };
  }, [currentUserId]);

  useEffect(() => {
    let cancelled = false;
    dedupeRequest(
      `chat:friends:${currentUserId}`,
      () => getFriends(),
    )
      .then((lists) => {
        if (cancelled) return;
        chat.setIncomingFriendRequests(lists.incoming);
        chat.setIncomingFriendCount(lists.incoming.length);
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") {
          console.error("[friends] notification_error", error.response?.data?.error ?? error.message);
        }
      });
    return () => { cancelled = true; };
  }, [currentUserId, chat.friendsRefreshVersion]);
}
