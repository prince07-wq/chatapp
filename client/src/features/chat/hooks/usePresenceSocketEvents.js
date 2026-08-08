import { resolveUploadedFileUrl } from "../../../api/fileApi.js";
import { getUserInitials } from "../utils/conversation.js";

function presenceNameKey(username) {
  return username ? `name:${username.trim().toLowerCase()}` : null;
}

export default function usePresenceSocketEvents({ chat, currentUserId, transport }) {
  function handleTypingStart({ room, socketId } = {}) {
    if (
      String(room) !== chat.activeRoomRef.current ||
      !socketId ||
      socketId === transport.getConnectionId()
    ) return;
    chat.setTypingSocketIds((ids) => new Set(ids).add(socketId));
  }

  function handleTypingStop({ room, socketId } = {}) {
    if (String(room) !== chat.activeRoomRef.current || !socketId) return;
    chat.setTypingSocketIds((ids) => {
      if (!ids.has(socketId)) return ids;
      const next = new Set(ids);
      next.delete(socketId);
      return next;
    });
  }

  function handleRoomJoined({ room } = {}) {
    if (String(room) === chat.activeRoomRef.current) {
      transport.emit("request_members", { room });
    }
  }

  function handleRoomMembers({ room, members = [] } = {}) {
    if (String(room) !== chat.activeRoomRef.current) return;
    const socketId = transport.getConnectionId();
    const others = members.filter(
      (member) =>
        member.socketId !== socketId &&
        String(member.userId) !== String(currentUserId),
    );
    chat.setActiveRoomMemberSocketIds(new Set(others.map((member) => member.socketId).filter(Boolean)));
    chat.setActiveRoomMembers(others);
  }

  function handleUserJoined({ room, socketId, userId, username, profileImage } = {}) {
    if (
      String(room) !== chat.activeRoomRef.current ||
      !socketId ||
      socketId === transport.getConnectionId()
    ) return;
    chat.setActiveRoomMemberSocketIds((ids) => new Set(ids).add(socketId));
    if (userId != null && String(userId) !== String(currentUserId)) {
      chat.setActiveRoomMembers((members) =>
        members.some((member) => member.socketId === socketId)
          ? members
          : [...members, { socketId, userId: String(userId), username, profileImage: profileImage || "" }],
      );
    }
  }

  function handleUserLeft({ room, socketId } = {}) {
    if (String(room) !== chat.activeRoomRef.current || !socketId) return;
    chat.setActiveRoomMemberSocketIds((ids) => {
      if (!ids.has(socketId)) return ids;
      const next = new Set(ids);
      next.delete(socketId);
      return next;
    });
    chat.setActiveRoomMembers((members) => members.filter((member) => member.socketId !== socketId));
  }

  function handleUserOnline({ userId, username, displayName, bio, profileImage } = {}) {
    if (userId != null && String(userId) === String(currentUserId)) return;
    if (userId != null) {
      const normalizedId = String(userId);
      chat.setAvailableDmUsers((users) => {
        const index = users.findIndex((user) => user.userId === normalizedId);
        if (index === -1) {
          return [...users, { userId: normalizedId, username: username || "User", displayName: displayName || "", bio: bio || "", profileImage: profileImage || "" }];
        }
        const current = users[index];
        if (
          (!username || current.username === username) &&
          (displayName === undefined || current.displayName === displayName) &&
          (bio === undefined || current.bio === bio) &&
          (profileImage === undefined || current.profileImage === profileImage)
        ) return users;
        return users.map((user, userIndex) => userIndex === index ? {
          ...user,
          username: username ?? user.username,
          displayName: displayName ?? user.displayName ?? "",
          bio: bio ?? user.bio ?? "",
          profileImage: profileImage ?? user.profileImage ?? "",
        } : user);
      });
    }
    chat.setOnlineUserKeys((keys) => {
      const next = new Set(keys);
      if (userId != null) next.add(`id:${userId}`);
      const nameKey = presenceNameKey(username);
      if (nameKey) next.add(nameKey);
      return next.size === keys.size ? keys : next;
    });
  }

  function handleUserOffline({ userId, username } = {}) {
    chat.setOnlineUserKeys((keys) => {
      const next = new Set(keys);
      if (userId != null) next.delete(`id:${userId}`);
      const nameKey = presenceNameKey(username);
      if (nameKey) next.delete(nameKey);
      return next.size === keys.size ? keys : next;
    });
  }

  function handleUserProfileUpdated({ userId, username, displayName, bio, profileImage } = {}) {
    if (userId == null) return;
    const normalizedId = String(userId);
    const changes = { username: username || "User", displayName: displayName || "", bio: bio || "", profileImage: profileImage || "" };
    chat.setAvailableDmUsers((users) => users.map((user) => user.userId === normalizedId ? { ...user, ...changes } : user));
    chat.setActiveRoomMembers((members) => members.map((member) => String(member.userId) === normalizedId ? { ...member, ...changes } : member));
    chat.setActiveProfileChat((conversation) =>
      String(conversation?.recipientId) === normalizedId
        ? { ...conversation, name: changes.displayName || changes.username, username: changes.username, initials: getUserInitials(changes.displayName || changes.username), imageSrc: resolveUploadedFileUrl(changes.profileImage) }
        : conversation,
    );
    chat.setOnlineUserKeys((keys) => {
      const next = new Set(keys);
      next.add(`id:${normalizedId}`);
      const nameKey = presenceNameKey(changes.username);
      if (nameKey) next.add(nameKey);
      return next;
    });
    chat.setFriendsRefreshVersion((version) => version + 1);
  }

  function handleFriendsUpdated(notification) {
    chat.setFriendsRefreshVersion((version) => version + 1);
    if (notification?.type !== "friend_request_accepted" || !notification.requestId || !notification.user?.userId) return;
    const accepted = {
      id: `friend-accepted:${notification.requestId}`,
      type: notification.type,
      requestId: String(notification.requestId),
      userId: String(notification.user.userId),
      username: notification.user.username || "User",
      createdAt: notification.createdAt || new Date().toISOString(),
    };
    chat.setFriendActivityNotifications((items) =>
      items.some((item) => item.id === accepted.id) ? items : [accepted, ...items],
    );
  }

  return {
    friends_updated: handleFriendsUpdated,
    room_joined: handleRoomJoined,
    room_members: handleRoomMembers,
    typing_start: handleTypingStart,
    typing_stop: handleTypingStop,
    user_joined: handleUserJoined,
    user_left: handleUserLeft,
    user_offline: handleUserOffline,
    user_online: handleUserOnline,
    user_profile_updated: handleUserProfileUpdated,
  };
}
