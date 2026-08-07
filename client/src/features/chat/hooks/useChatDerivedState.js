import { resolveUploadedFileUrl } from "../../../api/fileApi.js";
import useConversationDetails from "../../conversation-details/hooks/useConversationDetails.js";
import { chats } from "../constants/chatConfig.js";
import { getDmRoomId, getUserInitials } from "../utils/conversation.js";

function presenceNameKey(username) {
  return username ? `name:${username.trim().toLowerCase()}` : null;
}

export default function useChatDerivedState({ activeSection, currentUserId, chat }) {
  const deletedRooms = new Set(
    chat.deletedConversations.map((conversation) => conversation.room),
  );
  const userChats = chat.availableDmUsers
    .filter(
      (availableUser) =>
        availableUser?.userId != null &&
        String(availableUser.userId) !== String(currentUserId),
    )
    .map((availableUser) => ({
      id: `dm-${availableUser.userId}`,
      room: getDmRoomId(currentUserId, availableUser.userId),
      recipientId: String(availableUser.userId),
      name: availableUser.displayName || availableUser.username || "User",
      username: availableUser.username,
      initials: getUserInitials(availableUser.displayName || availableUser.username),
      imageSrc: resolveUploadedFileUrl(availableUser.profileImage),
      preview: "Start a conversation",
      time: "",
      tone: "bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]",
    }))
    .filter((candidate) => candidate.room);
  const dmChats = userChats.filter((candidate) =>
    chat.dmConversationUserIds.has(candidate.recipientId),
  );
  const roomChats = [...chats, ...chat.searchRoomChats].filter(
    (candidate) => !deletedRooms.has(candidate.room),
  );
  const visibleDmChats = dmChats.filter(
    (candidate) => !deletedRooms.has(candidate.room),
  );
  const roomMemberChats = Array.from(
    new Map(
      chat.activeRoomMembers
        .filter(
          (member) =>
            member?.userId != null &&
            String(member.userId) !== String(currentUserId),
        )
        .map((member) => [String(member.userId), member]),
    ).values(),
  )
    .map((member) => ({
      id: `member-${member.userId}`,
      room: getDmRoomId(currentUserId, member.userId),
      recipientId: String(member.userId),
      name: member.displayName || member.username || "User",
      username: member.username,
      initials: getUserInitials(member.displayName || member.username),
      imageSrc: resolveUploadedFileUrl(member.profileImage),
      preview: "Message",
      time: "",
      tone: "bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]",
    }))
    .filter((candidate) => candidate.room);
  const allChats = [...roomChats, ...visibleDmChats];

  const friendRequestNotifications = chat.notificationPreferences.friendRequests
    ? chat.incomingFriendRequests.map((request) => ({
        id: `friend-request:${request.requestId}`,
        type: "friend_request",
        name: request.username || "User",
        title: `${request.username || "Someone"} sent you a friend request`,
        subtitle: "Friend request",
        createdAt: request.createdAt,
        requestId: request.requestId,
      }))
    : [];
  const acceptedFriendNotifications = chat.notificationPreferences.friendRequests
    ? chat.friendActivityNotifications.map((notification) => ({
        ...notification,
        name: notification.username,
        title: `${notification.username} accepted your friend request`,
        subtitle: "You're now friends",
      }))
    : [];
  const conversationNotifications = Object.entries(chat.roomSummaries)
    .filter(([, summary]) => Number(summary?.unreadCount) > 0)
    .map(([room, summary]) => {
      const latestMessage = summary.latestMessage;
      const conversation = allChats.find((candidate) => candidate.room === room);
      if (!conversation || chat.isMutedConversation(room)) return null;
      const unreadCount = Math.max(1, Number(summary.unreadCount) || 0);
      const isPrivate = Boolean(conversation.recipientId || latestMessage?.isPrivate);
      if (
        (isPrivate && !chat.notificationPreferences.directMessages) ||
        (!isPrivate && !chat.notificationPreferences.roomMessages)
      ) return null;
      const attachmentLabel = latestMessage?.attachment
        ? latestMessage.attachment.mimeType?.startsWith("audio/")
          ? "Voice message"
          : latestMessage.attachment.fileName || "Attachment"
        : "";
      return {
        id: `conversation:${room}`,
        type: isPrivate ? "dm_message" : "room_message",
        name: conversation.name,
        title: `${unreadCount} unread ${unreadCount === 1 ? "message" : "messages"} in ${conversation.name}`,
        subtitle: latestMessage?.text || attachmentLabel || conversation.preview,
        createdAt: latestMessage?.createdAt,
        room,
        chat: conversation,
      };
    })
    .filter(Boolean);
  const notifications = Array.from(
    new Map(
      [...friendRequestNotifications, ...acceptedFriendNotifications, ...conversationNotifications]
        .map((notification) => [notification.id, notification]),
    ).values(),
  )
    .map((notification) => ({
      ...notification,
      read: chat.readNotificationIds.has(notification.id),
    }))
    .sort(
      (first, second) =>
        (new Date(second.createdAt || 0).getTime() || 0) -
        (new Date(first.createdAt || 0).getTime() || 0),
    );
  const visibleChats =
    activeSection === "dms"
      ? visibleDmChats
      : activeSection === "friends"
        ? userChats
        : activeSection === "members"
          ? roomMemberChats
          : activeSection === "member_profile" && chat.activeProfileChat
            ? [chat.activeProfileChat]
            : roomChats;
  const activeChat = allChats.find((candidate) => candidate.room === chat.activeRoom) ?? null;
  const conversationDetailsController = useConversationDetails(activeChat, {
    refreshKey: `${chat.socketConnected}:${chat.friendsRefreshVersion}`,
  });
  const displayedActiveChat = conversationDetailsController.resolvedChat;
  const activeChatOnline =
    Boolean(displayedActiveChat) &&
    (chat.activeRoomMemberSocketIds.size > 0 ||
      (displayedActiveChat.recipientId
        ? chat.onlineUserKeys.has(`id:${displayedActiveChat.recipientId}`)
        : chat.onlineUserKeys.has(presenceNameKey(displayedActiveChat.name))));
  const dmEmptyMessage = chat.loadingDmUsers
    ? "Loading people..."
    : chat.dmUsersError || "No private conversations yet.";

  return {
    activeChat,
    activeChatOnline,
    allChats,
    conversationDetailsController,
    displayedActiveChat,
    listEmptyMessage:
      activeSection === "dms"
        ? dmEmptyMessage
        : activeSection === "friends"
          ? chat.loadingDmUsers
            ? "Loading people..."
            : chat.dmUsersError || "No other users are available."
          : activeSection === "members"
            ? "No other members are currently in this room."
            : undefined,
    listTitle:
      activeSection === "dms"
        ? "Direct Messages"
        : activeSection === "friends"
          ? "Friends"
          : activeSection === "members"
            ? "Room Members"
            : activeSection === "member_profile"
              ? "Profile"
              : "Chats",
    notifications,
    peopleMode: ["friends", "members", "member_profile"].includes(activeSection),
    unreadNotificationCount: notifications.filter((item) => !item.read).length,
    userChats,
    visibleChats,
  };
}
