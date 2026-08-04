import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Bell,
  BellOff,
  EllipsisVertical,
  House,
  LogOut,
  MessageCircle,
  MessageSquare,
  PenLine,
  Pin,
  Phone,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  User,
  UserPlus,
  Video,
} from "lucide-react";

import ThemeToggle from "../../components/UI/ThemeToggle.jsx";
import Avatar from "../../components/Chat/Avatar.jsx";
import ChatListItem from "../../components/Chat/ChatListItem.jsx";
import ConversationHeader from "../../components/Chat/ConversationHeader.jsx";
import MessageBubble from "../../components/Chat/MessageBubble.jsx";
import MessageComposer from "../../components/Chat/MessageComposer.jsx";
import ReactionDetailsModal from "../../components/Chat/ReactionDetailsModal.jsx";
import DeleteConversationModal from "../../components/Chat/DeleteConversationModal.jsx";
import MuteConversationModal from "../../components/Chat/MuteConversationModal.jsx";
import NavigationItem from "../../components/Chat/NavigationItem.jsx";
import UserListItem from "../../components/Chat/UserListItem.jsx";
import FriendsPage from "../Friends/FriendsPage.jsx";
import NotificationsPage from "../Notifications/NotificationsPage.jsx";
import ProfilePage from "../Profile/ProfilePage.jsx";
import SettingsPage from "../Settings/SettingsPage.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getLatestPrivateMessagePage,
  getLatestRoomMessagePage,
  getPrivateMessagePage,
  getRoomMessagePage,
  editMessage as editMessageRequest,
  deleteMessage as deleteMessageRequest,
} from "../../api/messageApi.js";
import {
  getConversationPins,
  getConversationDeletions,
  getConversationMutes,
  getFriends,
  getOnlineUsers,
  setConversationPin,
  setConversationDeletion,
  setConversationMute,
} from "../../api/userApi.js";
import { getAccessToken } from "../../utils/tokenStorage.js";
import {
  loadNotificationPreferences,
  saveNotificationPreferences,
} from "../../utils/notificationPreferences.js";
import {
  resolveUploadedFileUrl,
  uploadFile,
} from "../../api/fileApi.js";

const INITIAL_ROOM = "test-room";
const EMPTY_ROOM_SUMMARIES = Object.freeze({});
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
]);
const VOICE_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function loadHiddenMessageIds(userId) {
  if (!userId) return new Set();
  try {
    const stored = JSON.parse(localStorage.getItem(`hiddenMessages:${userId}`));
    return new Set(Array.isArray(stored) ? stored.map(String) : []);
  } catch {
    return new Set();
  }
}

function saveHiddenMessageIds(userId, ids) {
  if (userId) {
    localStorage.setItem(`hiddenMessages:${userId}`, JSON.stringify([...ids]));
  }
}

function getVoiceMimeType() {
  return VOICE_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

function getVoiceFileExtension(mimeType) {
  if (mimeType.startsWith("audio/ogg")) return "ogg";
  if (mimeType.startsWith("audio/mp4")) return "m4a";
  return "webm";
}

function getDmRoomId(userIdA, userIdB) {
  if (userIdA == null || userIdB == null) return null;

  const firstId = String(userIdA);
  const secondId = String(userIdB);
  if (!firstId || !secondId || firstId === secondId) return null;

  return [firstId, secondId].sort().join("_");
}

function getUserInitials(username) {
  return String(username || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const navigationItems = [
  { label: "Rooms", icon: House, section: "rooms" },
  { label: "DMs", icon: MessageCircle, section: "dms" },
  { label: "Friends", icon: UserPlus, section: "friends" },
  { label: "Calls", icon: Phone },
  { label: "Notifications", icon: Bell, section: "notifications" },
  { label: "Profile", icon: User, section: "profile" },
  { label: "Settings", icon: Settings, section: "settings" },
];

const chats = [
  {
    id: 1,
    room: "test-room",
    name: "Aiden Morgan",
    initials: "AM",
    preview: "Hey! How are you?",
    time: "10:30 AM",
    unread: 2,
    online: true,
    active: true,
    tone:
      "bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]",
  },
  {
    id: 2,
    room: "product-studio",
    name: "Product Studio",
    initials: "PS",
    preview: "Maya: The updated flow is ready",
    time: "9:48 AM",
    unread: 8,
    group: true,
    tone:
      "bg-[#ECE8F3] text-[#65567B] dark:bg-[#373141] dark:text-[#D8CBE7]",
  },
  {
    id: 3,
    room: "design-circle",
    name: "Design Circle",
    initials: "DC",
    preview: "You: Shared a file",
    time: "9:15 AM",
    read: true,
    group: true,
    tone:
      "bg-[#E8EEE9] text-[#4D6856] dark:bg-[#2B3830] dark:text-[#C4D9CA]",
  },
  {
    id: 4,
    room: "nina-patel",
    name: "Nina Patel",
    initials: "NP",
    preview: "Photo",
    time: "Yesterday",
    unread: 1,
    tone:
      "bg-[#F1E7E7] text-[#795858] dark:bg-[#3D3030] dark:text-[#E0C6C6]",
  },
  {
    id: 5,
    room: "weekend-plans",
    name: "Weekend plans",
    initials: "WP",
    preview: "Sam: Dinner at 7?",
    time: "Yesterday",
    unread: 3,
    group: true,
    tone:
      "bg-[#F0EBDD] text-[#756440] dark:bg-[#3B372B] dark:text-[#E3D4AE]",
  },
  {
    id: 6,
    room: "jordan-lee",
    name: "Jordan Lee",
    initials: "JL",
    preview: "You: Sounds good to me",
    time: "Friday",
    read: true,
    tone:
      "bg-[#E7EAF2] text-[#515E7D] dark:bg-[#303541] dark:text-[#CBD2E4]",
  },
  {
    id: 7,
    room: "alex-chen",
    name: "Alex Chen",
    initials: "AC",
    preview: "Draft is ready for review",
    time: "Friday",
    tone:
      "bg-[#EAEAEA] text-[#5A5A5A] dark:bg-[#34373C] dark:text-[#D5D7DA]",
  },
];

const messages = [
  { id: 1, text: "Hey!", time: "10:28 AM", direction: "incoming" },
  {
    id: 2,
    text: "How are you doing today?",
    time: "10:28 AM",
    direction: "incoming",
  },
  {
    id: 3,
    text: "Hey! Great to hear from you.",
    time: "10:28 AM",
    direction: "outgoing",
    read: true,
    breakBefore: true,
  },
  {
    id: 4,
    text: "That’s great to hear! How is the new project going?",
    time: "10:29 AM",
    direction: "incoming",
    breakBefore: true,
  },
  {
    id: 5,
    text: "What are you working on?",
    time: "10:29 AM",
    direction: "incoming",
  },
  {
    id: 6,
    text: "I’m doing great, thanks!",
    time: "10:29 AM",
    direction: "outgoing",
    read: true,
    breakBefore: true,
  },
  {
    id: 7,
    text: "Just putting the finishing touches on the new workspace.",
    time: "10:29 AM",
    direction: "outgoing",
    read: true,
  },
  {
    id: 8,
    text: "Almost done.",
    time: "10:30 AM",
    direction: "outgoing",
    read: true,
  },
];

function formatMessageTime(value) {
  const date = value ? new Date(value) : new Date();

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function normalizeMessageReactions(value) {
  if (!Array.isArray(value)) return [];
  const seenUserIds = new Set();

  return value.reduce((activeReactions, reaction) => {
    if (!reaction?.emoji || !Array.isArray(reaction.userIds)) {
      return activeReactions;
    }

    const usersById = new Map(
      (reaction.users || []).map((reactionUser) => [
        String(reactionUser.userId),
        {
          userId: String(reactionUser.userId),
          username: reactionUser.username || "Unknown user",
          profileImage: resolveUploadedFileUrl(reactionUser.profileImage),
        },
      ]),
    );
    const userIds = [...new Set(reaction.userIds.map(String))].filter(
      (userId) => {
        if (seenUserIds.has(userId)) return false;
        seenUserIds.add(userId);
        return true;
      },
    );
    if (userIds.length === 0) return activeReactions;

    activeReactions.push({
      emoji: reaction.emoji,
      userIds,
      users: userIds.map(
        (userId) =>
          usersById.get(userId) || {
            userId,
            username: "Unknown user",
            profileImage: "",
          },
      ),
    });
    return activeReactions;
  }, []);
}

function normalizeSocketMessage(incomingMessage, currentUserId) {
  const message =
    incomingMessage?.message && typeof incomingMessage.message === "object"
      ? incomingMessage.message
      : incomingMessage;
  const text =
    message?.content ??
    message?.text ??
    (typeof incomingMessage?.message === "string"
      ? incomingMessage.message
      : "");
  const rawAttachment = message?.attachment ?? incomingMessage?.attachment;
  const attachment = rawAttachment?.fileUrl
    ? {
        fileUrl: resolveUploadedFileUrl(rawAttachment.fileUrl),
        fileName: rawAttachment.fileName,
        mimeType: rawAttachment.mimeType,
      }
    : null;
  const rawReplyTo = message?.replyTo ?? incomingMessage?.replyTo;
  const replyMessageId = rawReplyTo?.messageId;
  const replyTo = replyMessageId
    ? {
        messageId: String(replyMessageId),
        senderId:
          rawReplyTo.senderId == null ? null : String(rawReplyTo.senderId),
        senderUsername: rawReplyTo.senderUsername || "Unknown user",
        message: rawReplyTo.message || "",
        attachment: rawReplyTo.attachment || null,
      }
    : null;
  const reactions = normalizeMessageReactions(
    message?.reactions ?? incomingMessage?.reactions,
  );
  const reactionsUpdatedAt =
    message?.reactionsUpdatedAt ?? incomingMessage?.reactionsUpdatedAt ?? null;

  if (!text && !attachment) return null;

  const sender =
    message.senderId ??
    message.sender ??
    message.userId ??
    incomingMessage?.senderId ??
    incomingMessage?.sender ??
    incomingMessage?.userId;
  const senderId =
    sender && typeof sender === "object" ? sender._id ?? sender.id : sender;
  const createdAt =
    message.createdAt ??
    message.sentAt ??
    message.timestamp ??
    incomingMessage?.createdAt ??
    incomingMessage?.sentAt ??
    incomingMessage?.timestamp;
  const messageId =
    message._id ??
    message.id ??
    incomingMessage?._id ??
    incomingMessage?.id ??
    message.clientMessageId ??
    `${incomingMessage?.room ?? "unknown-room"}-${senderId ?? "unknown"}-${createdAt ?? text}`;
  const rawStatus =
    message.status ??
    message.deliveryStatus ??
    (message.read === true ? "seen" : undefined);

  return {
    id: `socket-${messageId}`,
    backendId: String(messageId),
    text,
    attachment,
    replyTo,
    reactions,
    reactionsUpdatedAt,
    createdAt: createdAt ?? new Date().toISOString(),
    time: message.time ?? formatMessageTime(createdAt),
    direction:
      senderId != null && String(senderId) === String(currentUserId)
        ? "outgoing"
        : "incoming",
    senderId: senderId == null ? null : String(senderId),
    senderUsername:
      message.senderUsername ?? incomingMessage?.senderUsername ?? null,
    isPrivate: Boolean(message.isPrivate ?? incomingMessage?.isPrivate),
    status: rawStatus === "read" ? "seen" : rawStatus,
    edited: Boolean(message.editedAt ?? incomingMessage?.editedAt),
    room: message.room ?? incomingMessage?.room,
  };
}

function getReactionRevision(message) {
  const revision = new Date(message?.reactionsUpdatedAt || 0).getTime();
  return Number.isNaN(revision) ? 0 : revision;
}

function getNewestReactionState(primary, candidate) {
  const source =
    getReactionRevision(candidate) >= getReactionRevision(primary)
      ? candidate
      : primary;

  return {
    reactions: source?.reactions ?? [],
    reactionsUpdatedAt: source?.reactionsUpdatedAt ?? null,
  };
}

const MESSAGE_STATUS_RANK = { sent: 1, delivered: 2, seen: 3 };
const MESSAGE_EDIT_WINDOW_MS = 15 * 60 * 1000;

function canEditMessage(message, now = Date.now()) {
  if (
    message?.direction !== "outgoing" ||
    !message.backendId ||
    !message.text ||
    message.attachment
  ) {
    return false;
  }

  const createdAt = new Date(message.createdAt).getTime();
  if (!Number.isFinite(createdAt)) return false;

  const age = now - createdAt;
  return age >= 0 && age <= MESSAGE_EDIT_WINDOW_MS;
}

function latestMessageStatus(currentStatus, nextStatus) {
  return (MESSAGE_STATUS_RANK[nextStatus] ?? 0) >
    (MESSAGE_STATUS_RANK[currentStatus] ?? 0)
    ? nextStatus
    : currentStatus;
}

function formatRelativeTime(value, now) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "just now";

  const elapsed = Math.max(0, now - timestamp);
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(elapsed / 3600000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (hours < 48) return "Yesterday";

  return new Intl.DateTimeFormat([], {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

function isLaterMessage(candidate, current) {
  if (!current) return true;

  const candidateTime = new Date(candidate.createdAt).getTime();
  const currentTime = new Date(current.createdAt).getTime();

  if (Number.isNaN(candidateTime)) return false;
  if (Number.isNaN(currentTime)) return true;
  return candidateTime >= currentTime;
}

function getRoomPreview(chat, roomSummary, now) {
  const latestMessage = roomSummary?.latestMessage;
  const latestReaction = roomSummary?.latestReaction;
  const latestMessageTime = new Date(latestMessage?.createdAt || 0).getTime();
  const latestReactionTime = new Date(latestReaction?.createdAt || 0).getTime();

  if (
    latestReaction &&
    (Number.isNaN(latestMessageTime) || latestReactionTime > latestMessageTime)
  ) {
    return {
      preview: `${latestReaction.emoji} Reacted to your message`,
      time: formatRelativeTime(latestReaction.createdAt, now),
    };
  }

  if (!latestMessage) {
    return { preview: chat.preview, time: chat.time };
  }

  const relativeTime = formatRelativeTime(latestMessage.createdAt, now);

  if (latestMessage.direction === "outgoing") {
    const status =
      latestMessage.status === "seen"
        ? "Seen"
        : latestMessage.status === "delivered"
          ? "Delivered"
          : "Sent";

    return { preview: `${status} ${relativeTime}`, time: "" };
  }

  const attachmentMimeType = latestMessage.attachment?.mimeType;
  const attachmentPreview = attachmentMimeType?.startsWith("image/")
    ? "Photo"
    : attachmentMimeType?.startsWith("audio/")
      ? "Voice message"
      : latestMessage.attachment?.fileName || "File";

  return {
    preview: latestMessage.text || attachmentPreview,
    time: relativeTime,
  };
}

function getConversationActivityTime(roomSummary) {
  const messageTime = new Date(
    roomSummary?.latestMessage?.createdAt || 0,
  ).getTime();
  const reactionTime = new Date(
    roomSummary?.latestReaction?.createdAt || 0,
  ).getTime();

  return Math.max(
    Number.isNaN(messageTime) ? 0 : messageTime,
    Number.isNaN(reactionTime) ? 0 : reactionTime,
  );
}

function presenceNameKey(username) {
  return username ? `name:${username.trim().toLowerCase()}` : null;
}

function IconButton({ label, children, className = "", ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
        "text-[#6F737B] transition-colors duration-200",
        "hover:bg-black/[0.045] hover:text-[#202226]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35",
        "dark:text-[#9CA2AC] dark:hover:bg-white/[0.07] dark:hover:text-white",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}

function NavigationRail({
  activeSection,
  incomingFriendCount,
  unreadNotificationCount,
  profileInitials,
  profileImage,
  loggingOut,
  onSectionChange,
  onLogout,
}) {
  return (
    <aside className="flex min-h-0 w-[76px] flex-col bg-[#17191D] text-white dark:bg-[#181A1F]">
      <div className="flex h-[84px] shrink-0 items-center justify-center border-b border-white/[0.06]">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/[0.07] bg-white/[0.055]">
          <MessageSquare size={22} strokeWidth={2} />
        </div>
      </div>

      <nav
        className="flex min-h-0 flex-1 flex-col items-center gap-2.5 overflow-y-auto px-2 py-3"
        aria-label="Primary navigation"
      >
        {navigationItems.map((item) => (
          <NavigationItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            active={item.section === activeSection}
            badge={
              item.section === "friends"
                ? incomingFriendCount || undefined
                : item.section === "notifications"
                  ? unreadNotificationCount || undefined
                : item.badge
            }
            onClick={
              item.section
                ? () => onSectionChange(item.section)
                : undefined
            }
          />
        ))}
      </nav>

      <div className="flex shrink-0 items-center justify-center gap-1 border-t border-white/[0.06] py-3">
        <Avatar
          size="sm"
          imageSrc={profileImage}
          initials={profileInitials}
          tone="border border-white/10 bg-[#25282E] text-white"
        />

        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          aria-label="Log out"
          title="Log out"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[#8F959E] transition-colors duration-200 hover:bg-white/[0.06] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogOut size={18} strokeWidth={1.9} />
        </button>
      </div>
    </aside>
  );
}

function ChatList({
  title = "Chats",
  chatItems = chats,
  emptyMessage,
  peopleMode = false,
  activeRoom,
  activeRoomOnline,
  onlineUserKeys,
  roomSummaries = EMPTY_ROOM_SUMMARIES,
  pinnedConversations = [],
  mutedConversations = [],
  relativeTimeNow,
  onSelectChat,
  onTogglePin,
  onRequestMute,
  onRequestDelete,
  onOpenProfile,
  onMessageUser,
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [conversationMenu, setConversationMenu] = useState(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const pinnedByRoom = new Map(
    pinnedConversations.map((conversation) => [
      conversation.room,
      new Date(conversation.pinnedAt).getTime() || 0,
    ]),
  );
  const mutedByRoom = new Map(
    mutedConversations.map((conversation) => [
      conversation.room,
      conversation.mutedUntil
        ? new Date(conversation.mutedUntil).getTime()
        : null,
    ]),
  );

  function isMuted(room) {
    if (!mutedByRoom.has(room)) return false;
    return isConversationMuted(
      { mutedUntil: mutedByRoom.get(room) },
      relativeTimeNow,
    );
  }

  useEffect(() => {
    if (!conversationMenu) return undefined;

    function closeMenu(event) {
      if (event.type === "keydown" && event.key !== "Escape") return;
      setConversationMenu(null);
    }

    document.addEventListener("click", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("click", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [conversationMenu]);

  function openConversationMenu(chat, event) {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === "click" && conversationMenu?.room === chat.room) {
      setConversationMenu(null);
      return;
    }

    const menuWidth = 176;
    const menuHeight = 140;
    const viewportPadding = 8;
    const triggerRect = event.currentTarget.getBoundingClientRect();
    const requestedLeft =
      event.type === "contextmenu"
        ? event.clientX
        : triggerRect.right - menuWidth;
    const requestedTop =
      event.type === "contextmenu" ? event.clientY : triggerRect.bottom + 4;

    setConversationMenu({
      room: chat.room,
      left: Math.max(
        viewportPadding,
        Math.min(requestedLeft, window.innerWidth - menuWidth - viewportPadding),
      ),
      top:
        requestedTop + menuHeight > window.innerHeight - viewportPadding
          ? Math.max(viewportPadding, requestedTop - menuHeight - 8)
          : requestedTop,
    });
  }

  function getChatSummary(chat) {
    return roomSummaries?.[chat.room] ?? {
      unreadCount: Math.max(0, chat.unread ?? 0),
      latestMessage: null,
    };
  }

  const unreadConversationCount = chatItems.filter(
    (chat) => Number(getChatSummary(chat).unreadCount) > 0,
  ).length;
  const groupConversationCount = chatItems.filter((chat) => chat.group).length;
  const originalChatIndexes = new Map(
    chatItems.map((chat, index) => [chat.room, index]),
  );
  const filteredChatItems = chatItems
    .filter((chat) => {
      const roomSummary = getChatSummary(chat);
      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "unread" && Number(roomSummary.unreadCount) > 0) ||
        (activeFilter === "groups" && chat.group);

      if (!matchesFilter) return false;
      if (!normalizedSearchQuery) return true;

      const { preview } = getRoomPreview(chat, roomSummary, relativeTimeNow);
      return `${chat.name} ${preview}`
        .toLowerCase()
        .includes(normalizedSearchQuery);
    })
    .sort((first, second) => {
      if (peopleMode) {
        return (
          (originalChatIndexes.get(first.room) ?? 0) -
          (originalChatIndexes.get(second.room) ?? 0)
        );
      }

      const firstPinnedAt = pinnedByRoom.get(first.room);
      const secondPinnedAt = pinnedByRoom.get(second.room);
      const firstPinned = firstPinnedAt !== undefined;
      const secondPinned = secondPinnedAt !== undefined;

      if (firstPinned !== secondPinned) return firstPinned ? -1 : 1;
      if (firstPinned && secondPinned && firstPinnedAt !== secondPinnedAt) {
        return secondPinnedAt - firstPinnedAt;
      }

      const activityDifference =
        getConversationActivityTime(getChatSummary(second)) -
        getConversationActivityTime(getChatSummary(first));
      if (activityDifference !== 0 && !firstPinned) return activityDifference;

      return (
        (originalChatIndexes.get(first.room) ?? 0) -
        (originalChatIndexes.get(second.room) ?? 0)
      );
    });
  const filteredEmptyMessage =
    activeFilter === "unread"
      ? "You're all caught up."
      : activeFilter === "groups"
        ? "No groups found."
        : normalizedSearchQuery
          ? "No conversations found."
          : emptyMessage;
  const activeChipColors =
    "bg-[#3B82F6] text-white hover:bg-[#3478E5] focus-visible:ring-[#3B82F6]/35";
  const inactiveChipColors =
    "border border-[#E5E6E3] text-[#646970] hover:border-[#D8DAD6] hover:bg-[#F7F7F5] focus-visible:ring-[#3B82F6]/30 dark:border-white/[0.08] dark:text-[#AEB3BB] dark:hover:bg-[#20242B]";

  return (
    <section className="hidden min-h-0 min-w-0 flex-col border-r border-[#ECEDEA] bg-white dark:border-white/[0.06] dark:bg-[#181A1F] md:flex">
      <header className="shrink-0 px-5 pb-4 pt-5 xl:px-6">
        <div className="flex h-10 items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9EA5]">
              Workspace
            </p>
            <h1 className="mt-0.5 text-[24px] font-semibold tracking-[-0.035em] text-[#1C1E22] dark:text-[#F3F4F6]">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            <IconButton label="New conversation">
              <PenLine size={19} strokeWidth={1.9} />
            </IconButton>
            <IconButton label="More chat options">
              <EllipsisVertical size={19} strokeWidth={1.9} />
            </IconButton>
          </div>
        </div>

        <div className="relative mt-5">
          <Search
            size={18}
            strokeWidth={1.8}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#969AA1]"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            aria-label="Search chats"
            placeholder="Search conversations"
            className="h-11 w-full rounded-[14px] border border-transparent bg-[#F4F4F2] pl-10 pr-11 text-[14px] text-[#25272B] outline-none transition-colors duration-200 placeholder:text-[#9A9EA5] focus:border-[#3B82F6]/35 focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/10 dark:bg-[#20242B] dark:text-[#F2F3F5] dark:placeholder:text-[#737A85] dark:focus:bg-[#20242B]"
          />
          <button
            type="button"
            aria-label="Search filters"
            className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[10px] text-[#858A92] transition-colors duration-200 hover:bg-black/[0.04] hover:text-[#3B82F6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 dark:hover:bg-white/[0.06]"
          >
            <SlidersHorizontal size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            aria-pressed={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
            className={`h-9 rounded-xl px-4 text-[13px] font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 ${activeFilter === "all" ? activeChipColors : inactiveChipColors}`}
          >
            All
          </button>
          <button
            type="button"
            aria-pressed={activeFilter === "unread"}
            onClick={() => setActiveFilter("unread")}
            className={`h-9 rounded-xl px-3.5 text-[13px] font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 ${activeFilter === "unread" ? activeChipColors : inactiveChipColors}`}
          >
            Unread{" "}
            <span
              className={`ml-1 ${activeFilter === "unread" ? "text-white/75" : "text-[#3B82F6]"}`}
            >
              {unreadConversationCount}
            </span>
          </button>
          <button
            type="button"
            aria-pressed={activeFilter === "groups"}
            onClick={() => setActiveFilter("groups")}
            className={`hidden h-9 rounded-xl px-3.5 text-[13px] font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 xl:block ${activeFilter === "groups" ? activeChipColors : inactiveChipColors}`}
          >
            Groups{" "}
            <span
              className={`ml-1 ${activeFilter === "groups" ? "text-white/75" : "text-[#8C9198]"}`}
            >
              {groupConversationCount}
            </span>
          </button>
          <IconButton
            label="Add filter"
            className="h-9 w-9 border border-[#E5E6E3] dark:border-white/[0.08]"
          >
            <Plus size={17} strokeWidth={1.9} />
          </IconButton>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-5 xl:px-4">
        {filteredChatItems.map((chat) => {
          if (peopleMode) {
            const online = onlineUserKeys.has(`id:${chat.recipientId}`);

            return (
              <UserListItem
                key={chat.id}
                avatar={{ initials: chat.initials, tone: chat.tone }}
                name={chat.name}
                online={online}
                onOpenProfile={() => onOpenProfile(chat)}
                onMessage={() => onMessageUser(chat)}
              />
            );
          }

          const roomSummary = getChatSummary(chat);
          const { preview, time } = getRoomPreview(
            chat,
            roomSummary,
            relativeTimeNow,
          );
          const online =
            chat.room === activeRoom
              ? activeRoomOnline
              : chat.recipientId
                ? onlineUserKeys.has(`id:${chat.recipientId}`)
                : onlineUserKeys.has(presenceNameKey(chat.name));

          return (
            <ChatListItem
              key={chat.id}
              avatar={{
                initials: chat.initials,
                imageSrc: chat.imageSrc,
                tone: chat.tone,
                group: chat.group,
              }}
              name={chat.name}
              preview={preview}
              time={time}
              unreadCount={roomSummary?.unreadCount ?? 0}
              active={chat.room === activeRoom}
              online={online}
              read={chat.read}
              pinned={pinnedByRoom.has(chat.room)}
              muted={isMuted(chat.room)}
              menuOpen={conversationMenu?.room === chat.room}
              onClick={() => onSelectChat(chat)}
              onMenuToggle={(event) => openConversationMenu(chat, event)}
            />
          );
        })}
        {conversationMenu && (
          <div
            role="menu"
            style={{
              left: conversationMenu.left,
              top: conversationMenu.top,
            }}
            className="fixed z-50 min-w-44 rounded-xl border border-[#E5E6E3] bg-white p-1.5 shadow-lg dark:border-white/[0.09] dark:bg-[#24272E]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                const room = conversationMenu.room;
                setConversationMenu(null);
                onTogglePin(room);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-[#44484F] hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:text-[#E1E3E7] dark:hover:bg-white/[0.07]"
            >
              <Pin size={15} strokeWidth={1.9} />
              {pinnedByRoom.has(conversationMenu.room)
                ? "Unpin conversation"
                : "Pin conversation"}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                const chat = chatItems.find(
                  (candidate) => candidate.room === conversationMenu.room,
                );
                setConversationMenu(null);
                if (chat) onRequestMute(chat);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-[#44484F] hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:text-[#E1E3E7] dark:hover:bg-white/[0.07]"
            >
              <BellOff size={15} strokeWidth={1.9} />
              {isMuted(conversationMenu.room)
                ? "Unmute conversation"
                : "Mute conversation"}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.stopPropagation();
                const chat = chatItems.find(
                  (candidate) => candidate.room === conversationMenu.room,
                );
                setConversationMenu(null);
                if (chat) onRequestDelete(chat);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-[#B65A5A] hover:bg-[#FBF3F3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D56B6B]/30 dark:text-[#E39A9A] dark:hover:bg-[#302526]"
            >
              <Trash2 size={15} strokeWidth={1.9} />
              Delete conversation
            </button>
          </div>
        )}
        {filteredChatItems.length === 0 && filteredEmptyMessage && (
          <p className="px-3 py-8 text-center text-[13px] text-[#92969D] dark:text-[#777E88]">
            {filteredEmptyMessage}
          </p>
        )}
      </div>
    </section>
  );
}

function ConversationMessages({
  messages,
  isTyping,
  messagesEndRef,
  scrollContainerRef,
  onScroll,
  loadingOlderMessages,
  currentUserId,
  onReactMessage,
  onOpenReactionDetails,
  onReplyMessage,
  onEditMessage,
  onDeleteMessageForMe,
  onDeleteMessageForEveryone,
}) {
  const [editEligibilityTime, setEditEligibilityTime] = useState(Date.now());
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const highlightTimeoutRef = useRef(null);

  useEffect(
    () => () => window.clearTimeout(highlightTimeoutRef.current),
    [],
  );

  useEffect(() => {
    const now = Date.now();
    const nextExpiration = messages.reduce((soonest, message) => {
      if (!canEditMessage(message, now)) return soonest;
      const expiration =
        new Date(message.createdAt).getTime() + MESSAGE_EDIT_WINDOW_MS;
      return soonest === null || expiration < soonest ? expiration : soonest;
    }, null);

    if (nextExpiration === null) return undefined;

    const timeoutId = window.setTimeout(
      () => setEditEligibilityTime(Date.now()),
      Math.max(0, nextExpiration - now + 25),
    );
    return () => window.clearTimeout(timeoutId);
  }, [messages, editEligibilityTime]);

  const eligibilityNow = Math.max(editEligibilityTime, Date.now());

  function handleReplyQuoteClick(messageId) {
    const original = messages.find(
      (message) => String(message.backendId) === String(messageId),
    );
    if (!original) return false;

    const element = Array.from(
      scrollContainerRef.current?.querySelectorAll("[data-message-id]") || [],
    ).find((candidate) => candidate.dataset.messageId === original.id);
    if (!element) return false;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(original.id);
    window.clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = window.setTimeout(
      () => setHighlightedMessageId(null),
      1400,
    );
    return true;
  }

  function renderTypingIndicator() {
    if (!isTyping) return null;

    return (
      <div
        className="mt-2 flex justify-start"
        role="status"
        aria-label="Another user is typing"
      >
        <div className="typing-bubble relative flex h-9 w-[54px] items-center justify-center gap-1 rounded-[16px] rounded-bl-[6px] border border-black/[0.035] bg-[#E9E9EB] shadow-[0_2px_7px_rgba(20,22,26,0.025)] dark:border-white/[0.05] dark:bg-[#2C3036]">
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#8E8E93] dark:bg-[#9A9EA6]" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#8E8E93] dark:bg-[#9A9EA6]" />
          <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[#8E8E93] dark:bg-[#9A9EA6]" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      onScroll={onScroll}
      className="min-h-0 flex-1 overflow-y-auto bg-[#F7F7F5] px-5 py-7 dark:bg-[#111315] sm:px-8 lg:px-10 xl:px-14"
    >
      <div className="relative mx-auto flex min-h-full max-w-[1100px] flex-col">
        {loadingOlderMessages && (
          <div className="pointer-events-none sticky top-0 z-10 flex h-0 justify-center">
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#8C9198] shadow-[0_2px_7px_rgba(20,22,26,0.04)] dark:bg-[#20242B] dark:text-[#8F96A0]">
              Loading older messages...
            </span>
          </div>
        )}
        <div className="flex justify-center">
          <span className="rounded-full border border-black/[0.035] bg-white px-4 py-1.5 text-[11px] font-medium text-[#777C84] shadow-[0_2px_7px_rgba(20,22,26,0.025)] dark:border-white/[0.05] dark:bg-[#20242B] dark:text-[#AEB3BB]">
            Today
          </span>
        </div>

        <div className="mt-7 flex flex-1 flex-col justify-center pb-4">
          {messages.map((message, index) => (
            <Fragment key={message.id}>
              <MessageBubble
                messageId={message.id}
                text={message.text}
                attachment={message.attachment}
                replyTo={message.replyTo}
                reactions={message.reactions}
                currentUserId={currentUserId}
                senderType={
                  message.direction === "outgoing" ? "sent" : "received"
                }
                timestamp={message.time}
                deliveryStatus={
                  message.direction === "outgoing"
                    ? message.status ?? (message.read ? "seen" : undefined)
                    : undefined
                }
                edited={message.edited}
                breakBefore={message.breakBefore}
                highlighted={highlightedMessageId === message.id}
                onReact={
                  message.backendId
                    ? (emoji) => onReactMessage(message, emoji)
                    : undefined
                }
                onOpenReactionDetails={() => onOpenReactionDetails(message)}
                onReply={
                  message.backendId ? () => onReplyMessage(message) : undefined
                }
                onReplyQuoteClick={handleReplyQuoteClick}
                onEdit={
                  canEditMessage(message, eligibilityNow)
                    ? () => onEditMessage(message)
                    : undefined
                }
                onDeleteForMe={
                  message.direction === "outgoing" && message.backendId
                    ? () => onDeleteMessageForMe(message)
                    : undefined
                }
                onDeleteForEveryone={
                  message.direction === "outgoing" && message.backendId
                    ? () => onDeleteMessageForEveryone(message)
                    : undefined
                }
              />
              {index === messages.length - 1 && renderTypingIndicator()}
            </Fragment>
          ))}
          {messages.length === 0 && renderTypingIndicator()}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}

function ConversationPanel({
  activeChat,
  activeChatOnline,
  isTyping,
  messages,
  messagesEndRef,
  scrollContainerRef,
  onMessagesScroll,
  loadingOlderMessages,
  messageValue,
  onMessageChange,
  onMessageSend,
  selectedFile,
  onFileSelect,
  onFileRemove,
  recordingState,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onShowMembers,
  composerLoading,
  composerError,
  currentUserId,
  onReactMessage,
  onOpenReactionDetails,
  replyingTo,
  onCancelReply,
  onReplyMessage,
  editingMessage,
  onCancelEdit,
  onEditMessage,
  onDeleteMessageForMe,
  onDeleteMessageForEveryone,
}) {
  if (!activeChat) {
    return (
      <section className="relative col-start-2 flex min-h-0 min-w-0 flex-1 items-center justify-center bg-[#F7F7F5] dark:bg-[#111315] md:col-start-auto">
        <p className="text-[14px] text-[#858A92] dark:text-[#9198A2]">
          Select a conversation to start chatting.
        </p>
      </section>
    );
  }

  return (
    <section className="relative col-start-2 flex min-h-0 min-w-0 flex-col bg-[#F7F7F5] dark:bg-[#111315] md:col-start-auto">
      <ConversationHeader
        avatar={{
          initials: activeChat.initials,
          imageSrc: activeChat.imageSrc,
          tone: activeChat.tone,
          group: activeChat.group,
        }}
        name={activeChat.name}
        statusText={activeChatOnline ? "Online" : "Offline"}
        online={activeChatOnline}
        headerActions={
          <>
            <IconButton label="Start a voice call" className="hidden sm:flex">
              <Phone size={19} strokeWidth={1.8} />
            </IconButton>
            <IconButton label="Start a video call" className="hidden lg:flex">
              <Video size={20} strokeWidth={1.8} />
            </IconButton>
            <IconButton label="Search this conversation">
              <Search size={20} strokeWidth={1.8} />
            </IconButton>
            <IconButton label="View room members" onClick={onShowMembers}>
              <UserPlus size={19} strokeWidth={1.8} />
            </IconButton>
            <IconButton label="Conversation options">
              <EllipsisVertical size={20} strokeWidth={1.8} />
            </IconButton>
          </>
        }
      />
      <ConversationMessages
        messages={messages}
        isTyping={isTyping}
        messagesEndRef={messagesEndRef}
        scrollContainerRef={scrollContainerRef}
        onScroll={onMessagesScroll}
        loadingOlderMessages={loadingOlderMessages}
        currentUserId={currentUserId}
        onReactMessage={onReactMessage}
        onOpenReactionDetails={onOpenReactionDetails}
        onReplyMessage={onReplyMessage}
        onEditMessage={onEditMessage}
        onDeleteMessageForMe={onDeleteMessageForMe}
        onDeleteMessageForEveryone={onDeleteMessageForEveryone}
      />
      <MessageComposer
        value={messageValue}
        onChange={onMessageChange}
        onSend={onMessageSend}
        selectedFile={selectedFile}
        onFileSelect={onFileSelect}
        onFileRemove={onFileRemove}
        recordingState={recordingState}
        recordingDuration={recordingDuration}
        onStartRecording={onStartRecording}
        onStopRecording={onStopRecording}
        onCancelRecording={onCancelRecording}
        loading={composerLoading}
        error={composerError}
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        editingMessage={editingMessage}
        onCancelEdit={onCancelEdit}
        placeholder="Type a message..."
      />
    </section>
  );
}

export default function ChatPlaceholder() {
  const { user, logout, updateAuthenticatedUser } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeSection, setActiveSection] = useState("rooms");
  const [activeRoom, setActiveRoom] = useState(INITIAL_ROOM);
  const [activeDmRecipientId, setActiveDmRecipientId] = useState(null);
  const [availableDmUsers, setAvailableDmUsers] = useState([]);
  const [dmConversationUserIds, setDmConversationUserIds] = useState(
    () => new Set(),
  );
  const [activeProfileChat, setActiveProfileChat] = useState(null);
  const [activeRoomMembers, setActiveRoomMembers] = useState([]);
  const [loadingDmUsers, setLoadingDmUsers] = useState(true);
  const [dmUsersError, setDmUsersError] = useState("");
  const [incomingFriendCount, setIncomingFriendCount] = useState(0);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState([]);
  const [friendsRefreshVersion, setFriendsRefreshVersion] = useState(0);
  const [friendsInitialTab, setFriendsInitialTab] = useState("friends");
  const [friendActivityNotifications, setFriendActivityNotifications] =
    useState([]);
  const [readNotificationIds, setReadNotificationIds] = useState(
    () => new Set(),
  );
  const [notificationPreferences, setNotificationPreferences] = useState(
    loadNotificationPreferences,
  );
  const [pinnedConversations, setPinnedConversations] = useState([]);
  const [deletedConversations, setDeletedConversations] = useState([]);
  const [mutedConversations, setMutedConversations] = useState([]);
  const [muteConfirmation, setMuteConfirmation] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [deletingConversation, setDeletingConversation] = useState(false);
  const [deleteConversationError, setDeleteConversationError] = useState("");
  const [chatMessages, setChatMessages] = useState(messages);
  const [roomSummaries, setRoomSummaries] = useState(() =>
    Object.fromEntries(
      chats.map((chat) => [
        chat.room,
        {
          unreadCount: Math.max(0, chat.unread ?? 0),
          latestMessage: null,
        },
      ]),
    ),
  );
  const [relativeTimeNow, setRelativeTimeNow] = useState(() => Date.now());
  const [messageValue, setMessageValue] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [reactionDetailsMessageId, setReactionDetailsMessageId] =
    useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [recordingState, setRecordingState] = useState("idle");
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [attachmentError, setAttachmentError] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [typingSocketIds, setTypingSocketIds] = useState(() => new Set());
  const [onlineUserKeys, setOnlineUserKeys] = useState(() => new Set());
  const [activeRoomMemberSocketIds, setActiveRoomMemberSocketIds] = useState(
    () => new Set(),
  );
  const [socketConnected, setSocketConnected] = useState(false);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesScrollRef = useRef(null);
  const socketRef = useRef(null);
  const activeRoomRef = useRef(INITIAL_ROOM);
  const activeDmRecipientIdRef = useRef(null);
  const joinedRoomRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingRoomRef = useRef(null);
  const isTypingRef = useRef(false);
  const oldestPageRef = useRef(null);
  const hasOlderMessagesRef = useRef(false);
  const olderRequestInFlightRef = useRef(false);
  const historyGenerationRef = useRef(0);
  const isNearBottomRef = useRef(true);
  const initialScrollPendingRef = useRef(false);
  const prependScrollSnapshotRef = useRef(null);
  const shouldAutoScrollNewMessageRef = useRef(false);
  const wasTypingRef = useRef(false);
  const seenEmissionIdsRef = useRef(new Set());
  const receivedSocketMessageIdsRef = useRef(new Set());
  const pendingActiveRoomSeenRef = useRef(INITIAL_ROOM);
  const sendInFlightRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const recordingStartedAtRef = useRef(0);
  const recordingSessionRef = useRef(0);
  const voiceSendPendingRef = useRef(false);
  const hiddenMessageIdsRef = useRef(new Set());
  const deletedConversationRoomsRef = useRef(new Set());

  const profileName = user?.username || user?.email || "You";
  const profileInitials = profileName.slice(0, 2).toUpperCase();
  const currentUserId = user?._id ?? user?.id;
  const mutedConversationsByRoom = new Map(
    mutedConversations.map((conversation) => [conversation.room, conversation]),
  );
  const isMutedConversation = (room) =>
    isConversationMuted(
      mutedConversationsByRoom.get(room),
      relativeTimeNow,
    );
  const deletedConversationRooms = new Set(
    deletedConversations.map((conversation) => conversation.room),
  );
  const reactionDetailsMessage = chatMessages.find(
    (message) => message.id === reactionDetailsMessageId,
  );

  useEffect(() => {
    hiddenMessageIdsRef.current = loadHiddenMessageIds(currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    deletedConversationRoomsRef.current = new Set(
      deletedConversations.map((conversation) => conversation.room),
    );
  }, [deletedConversations]);

  useEffect(() => {
    if (!currentUserId) return undefined;

    const controller = new AbortController();
    getConversationPins({ signal: controller.signal })
      .then((pins) => {
        if (!controller.signal.aborted) setPinnedConversations(pins);
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") {
          console.error(
            "[conversation-pins] load_error",
            error.response?.data?.error ?? error.message,
          );
        }
      });

    return () => controller.abort();
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return undefined;

    const controller = new AbortController();
    getConversationMutes({ signal: controller.signal })
      .then((conversations) => {
        if (!controller.signal.aborted) setMutedConversations(conversations);
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") {
          console.error(
            "[conversation-mutes] load_error",
            error.response?.data?.error ?? error.message,
          );
        }
      });

    return () => controller.abort();
  }, [currentUserId]);

  useEffect(() => {
    const now = Date.now();
    const nextExpiry = mutedConversations
      .map((conversation) => new Date(conversation.mutedUntil).getTime())
      .filter((mutedUntil) => Number.isFinite(mutedUntil) && mutedUntil > now)
      .sort((first, second) => first - second)[0];
    if (!nextExpiry) return undefined;

    const timeout = setTimeout(() => {
      const expiredRooms = mutedConversations
        .filter(
          (conversation) =>
            conversation.mutedUntil &&
            new Date(conversation.mutedUntil).getTime() <= Date.now(),
        )
        .map((conversation) => conversation.room);
      if (expiredRooms.length === 0) return;

      setMutedConversations((currentConversations) =>
        currentConversations.filter(
          (conversation) => !expiredRooms.includes(conversation.room),
        ),
      );
      expiredRooms.forEach((room) => {
        setConversationMute(room, false).catch((error) => {
          console.error(
            "[conversation-mutes] expiry_error",
            error.response?.data?.error ?? error.message,
          );
        });
      });
    }, Math.max(0, nextExpiry - now) + 50);

    return () => clearTimeout(timeout);
  }, [mutedConversations]);

  useEffect(() => {
    if (!currentUserId) return undefined;

    const controller = new AbortController();
    getConversationDeletions({ signal: controller.signal })
      .then((conversations) => {
        if (controller.signal.aborted) return;
        setDeletedConversations(conversations);
        const activeDeletedConversation = conversations.find(
          (conversation) => conversation.room === activeRoomRef.current,
        );
        if (activeDeletedConversation) {
          const { room } = activeDeletedConversation;
          setPinnedConversations((currentPins) =>
            currentPins.filter((conversation) => conversation.room !== room),
          );
          setRoomSummaries((currentSummaries) => {
            const { [room]: removedSummary, ...remainingSummaries } = currentSummaries;
            return removedSummary ? remainingSummaries : currentSummaries;
          });
          setChatMessages((currentMessages) =>
            currentMessages.filter((message) => message.room !== room),
          );
          const socket = socketRef.current;
          if (socket?.connected && joinedRoomRef.current === room) {
            socket.emit("leave_room", { room });
            joinedRoomRef.current = null;
          }
          activeRoomRef.current = null;
          activeDmRecipientIdRef.current = null;
          pendingActiveRoomSeenRef.current = null;
          historyGenerationRef.current += 1;
          setActiveRoom(null);
          setActiveDmRecipientId(null);
          setActiveRoomMembers([]);
          setActiveRoomMemberSocketIds(new Set());
          setTypingSocketIds(new Set());
          setEditingMessage(null);
          setReplyingTo(null);
          setReactionDetailsMessageId(null);
          setMessageValue("");
        }
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") {
          console.error(
            "[conversation-deletions] load_error",
            error.response?.data?.error ?? error.message,
          );
        }
      });

    return () => controller.abort();
  }, [currentUserId]);

  useEffect(() => {
    const pinnedDmUsers = pinnedConversations.filter(
      (conversation) => conversation.recipientId,
    );
    if (pinnedDmUsers.length === 0) return undefined;

    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setAvailableDmUsers((currentUsers) => {
        const usersById = new Map(
          currentUsers.map((availableUser) => [
            String(availableUser.userId),
            availableUser,
          ]),
        );
        let changed = false;

        pinnedDmUsers.forEach((conversation) => {
          const recipientId = String(conversation.recipientId);
          if (usersById.has(recipientId)) return;
          changed = true;
          usersById.set(recipientId, {
            userId: recipientId,
            username: conversation.username || "User",
            profileImage: conversation.profileImage || "",
          });
        });

        return changed ? Array.from(usersById.values()) : currentUsers;
      });
      setDmConversationUserIds((currentIds) => {
        const nextIds = new Set(currentIds);
        pinnedDmUsers.forEach((conversation) =>
          nextIds.add(String(conversation.recipientId)),
        );
        return nextIds.size === currentIds.size ? currentIds : nextIds;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [pinnedConversations]);

  useEffect(() => {
    if (!currentUserId) return undefined;

    const controller = new AbortController();
    Promise.allSettled(
      chats.map(async (chat) => {
        const latestPage = await getLatestRoomMessagePage(chat.room, {
          signal: controller.signal,
        });
        const latestMessage = normalizeSocketMessage(
          latestPage.messages[latestPage.messages.length - 1],
          currentUserId,
        );
        if (latestMessage) updateRoomLatestMessage(latestMessage);
      }),
    ).then((results) => {
      if (controller.signal.aborted) return;
      results.forEach((result, index) => {
        if (result.status === "rejected" && result.reason?.code !== "ERR_CANCELED") {
          console.error(
            `[rooms] summary_error:${chats[index].room}`,
            result.reason?.response?.data?.error ?? result.reason?.message,
          );
        }
      });
    });

    return () => controller.abort();
  }, [currentUserId]);
  const userChats = availableDmUsers
    .filter(
      (availableUser) =>
        availableUser?.userId != null &&
        String(availableUser.userId) !== String(currentUserId),
    )
    .map((availableUser) => ({
      id: `dm-${availableUser.userId}`,
      room: getDmRoomId(currentUserId, availableUser.userId),
      recipientId: String(availableUser.userId),
      name: availableUser.username || "User",
      initials: getUserInitials(availableUser.username),
      imageSrc: resolveUploadedFileUrl(availableUser.profileImage),
      preview: "Start a conversation",
      time: "",
      tone:
        "bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]",
    }))
    .filter((chat) => chat.room);
  const dmChats = userChats.filter((chat) =>
    dmConversationUserIds.has(chat.recipientId),
  );
  const roomChats = chats.filter(
    (chat) => !deletedConversationRooms.has(chat.room),
  );
  const visibleDmChats = dmChats.filter(
    (chat) => !deletedConversationRooms.has(chat.room),
  );
  const roomMemberChats = Array.from(
    new Map(
      activeRoomMembers
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
      name: member.username || "User",
      initials: getUserInitials(member.username),
      imageSrc: resolveUploadedFileUrl(member.profileImage),
      preview: "Message",
      time: "",
      tone:
        "bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]",
    }))
    .filter((chat) => chat.room);
  const allChats = [...roomChats, ...visibleDmChats];
  const friendRequestNotifications = notificationPreferences.friendRequests
    ? incomingFriendRequests.map((request) => ({
        id: `friend-request:${request.requestId}`,
        type: "friend_request",
        name: request.username || "User",
        title: `${request.username || "Someone"} sent you a friend request`,
        subtitle: "Friend request",
        createdAt: request.createdAt,
        requestId: request.requestId,
      }))
    : [];
  const acceptedFriendNotifications = notificationPreferences.friendRequests
    ? friendActivityNotifications.map((notification) => ({
        ...notification,
        name: notification.username,
        title: `${notification.username} accepted your friend request`,
        subtitle: "You're now friends",
      }))
    : [];
  const conversationNotifications = Object.entries(roomSummaries)
    .filter(([, summary]) => Number(summary?.unreadCount) > 0)
    .map(([room, summary]) => {
      const latestMessage = summary.latestMessage;
      const chat = allChats.find((candidate) => candidate.room === room);
      if (!chat) return null;
      if (isMutedConversation(room)) return null;

      const unreadCount = Math.max(1, Number(summary.unreadCount) || 0);
      const isPrivate = Boolean(chat.recipientId || latestMessage?.isPrivate);
      if (
        (isPrivate && !notificationPreferences.directMessages) ||
        (!isPrivate && !notificationPreferences.roomMessages)
      ) {
        return null;
      }
      const attachmentLabel = latestMessage?.attachment
        ? latestMessage.attachment.mimeType?.startsWith("audio/")
          ? "Voice message"
          : latestMessage.attachment.fileName || "Attachment"
        : "";

      return {
        id: `conversation:${room}`,
        type: isPrivate ? "dm_message" : "room_message",
        name: chat.name,
        title: `${unreadCount} unread ${unreadCount === 1 ? "message" : "messages"} in ${chat.name}`,
        subtitle: latestMessage?.text || attachmentLabel || chat.preview,
        createdAt: latestMessage?.createdAt,
        room,
        chat,
      };
    })
    .filter(Boolean);
  const notifications = Array.from(
    new Map(
      [
        ...friendRequestNotifications,
        ...acceptedFriendNotifications,
        ...conversationNotifications,
      ].map((notification) => [notification.id, notification]),
    ).values(),
  )
    .map((notification) => ({
      ...notification,
      read: readNotificationIds.has(notification.id),
    }))
    .sort((first, second) => {
      const firstTime = new Date(first.createdAt || 0).getTime() || 0;
      const secondTime = new Date(second.createdAt || 0).getTime() || 0;
      return secondTime - firstTime;
    });
  const unreadNotificationCount = notifications.filter(
    (notification) => !notification.read,
  ).length;
  const visibleChats =
    activeSection === "dms"
      ? visibleDmChats
      : activeSection === "friends"
        ? userChats
        : activeSection === "members"
          ? roomMemberChats
          : activeSection === "member_profile" && activeProfileChat
            ? [activeProfileChat]
            : roomChats;
  const peopleMode = ["friends", "members", "member_profile"].includes(
    activeSection,
  );
  const dmEmptyMessage = loadingDmUsers
    ? "Loading people..."
    : dmUsersError || "No private conversations yet.";
  const listTitle =
    activeSection === "dms"
      ? "Direct Messages"
      : activeSection === "friends"
        ? "Friends"
        : activeSection === "members"
          ? "Room Members"
          : activeSection === "member_profile"
            ? "Profile"
            : "Chats";
  const listEmptyMessage =
    activeSection === "dms"
      ? dmEmptyMessage
      : activeSection === "friends"
        ? loadingDmUsers
          ? "Loading people..."
          : dmUsersError || "No other users are available."
        : activeSection === "members"
          ? "No other members are currently in this room."
          : undefined;
  const activeChat = allChats.find((chat) => chat.room === activeRoom) ?? null;
  const activeChatOnline =
    Boolean(activeChat) &&
    (activeRoomMemberSocketIds.size > 0 ||
    (activeChat.recipientId
      ? onlineUserKeys.has(`id:${activeChat.recipientId}`)
      : onlineUserKeys.has(presenceNameKey(activeChat.name))));

  useEffect(() => {
    const controller = new AbortController();
    setLoadingDmUsers(true);
    setDmUsersError("");

    getOnlineUsers({ signal: controller.signal })
      .then((users) => {
        const uniqueUsers = Array.from(
          new Map(
            users
              .filter(
                (availableUser) =>
                  availableUser?.userId != null &&
                  String(availableUser.userId) !== String(currentUserId),
              )
              .map((availableUser) => [
                String(availableUser.userId),
                {
                  userId: String(availableUser.userId),
                  username: availableUser.username || "User",
                  profileImage: availableUser.profileImage || "",
                },
              ]),
          ).values(),
        );

        setAvailableDmUsers((currentUsers) =>
          Array.from(
            new Map(
              [...currentUsers, ...uniqueUsers].map((availableUser) => [
                String(availableUser.userId),
                availableUser,
              ]),
            ).values(),
          ),
        );
        setOnlineUserKeys((currentKeys) => {
          const nextKeys = new Set(currentKeys);
          uniqueUsers.forEach((availableUser) => {
            nextKeys.add(`id:${availableUser.userId}`);
            const nameKey = presenceNameKey(availableUser.username);
            if (nameKey) nextKeys.add(nameKey);
          });
          return nextKeys;
        });
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") {
          setDmUsersError(
            error.response?.data?.message ?? "Unable to load direct messages.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingDmUsers(false);
      });

    return () => controller.abort();
  }, [currentUserId]);

  useEffect(() => {
    const controller = new AbortController();

    getFriends({ signal: controller.signal })
      .then((friendLists) => {
        if (controller.signal.aborted) return;
        setIncomingFriendRequests(friendLists.incoming);
        setIncomingFriendCount(friendLists.incoming.length);
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") {
          console.error(
            "[friends] notification_error",
            error.response?.data?.error ?? error.message,
          );
        }
      });

    return () => controller.abort();
  }, [currentUserId, friendsRefreshVersion]);

  useEffect(() => {
    if (availableDmUsers.length === 0) return undefined;

    const controller = new AbortController();

    Promise.allSettled(
      availableDmUsers.map(async (availableUser) => {
        if (String(availableUser.userId) === String(currentUserId)) return null;

        const latestPage = await getLatestPrivateMessagePage(
          availableUser.userId,
          { signal: controller.signal },
        );
        if (latestPage.messages.length === 0) return null;

        const latestMessage = normalizeSocketMessage(
          latestPage.messages[latestPage.messages.length - 1],
          currentUserId,
        );
        if (latestMessage) updateRoomLatestMessage(latestMessage);

        return String(availableUser.userId);
      }),
    ).then((results) => {
      if (controller.signal.aborted) return;

      const existingUserIds = results
        .filter((result) => result.status === "fulfilled" && result.value)
        .map((result) => result.value);

      if (existingUserIds.length > 0) {
        setDmConversationUserIds((currentIds) => {
          const nextIds = new Set(currentIds);
          existingUserIds.forEach((userId) => nextIds.add(userId));
          return nextIds.size === currentIds.size ? currentIds : nextIds;
        });
      }
    });

    return () => controller.abort();
  }, [availableDmUsers, currentUserId]);

  useEffect(() => {
    const token = getAccessToken();
    const socketUrl = import.meta.env.VITE_SOCKET_URL;

    if (!token || !socketUrl) {
      console.error("Socket connection requires an access token and VITE_SOCKET_URL.");
      return undefined;
    }

    const socket = io(socketUrl, { auth: { token } });
    socketRef.current = socket;

    function handleConnect() {
      const room = activeRoomRef.current;
      if (!room) {
        setSocketConnected(true);
        return;
      }
      if (joinedRoomRef.current === room) return;

      const payload = { room };
      setSocketConnected(true);
      console.info("[socket] connect", socket.id);
      console.info("[socket] join", payload);
      socket.emit("join_room", payload);
      joinedRoomRef.current = room;

      getOnlineUsers()
        .then((users) => {
          if (socketRef.current !== socket) return;

          const onlinePeers = users
            .filter(
              (availableUser) =>
                availableUser?.userId != null &&
                String(availableUser.userId) !== String(currentUserId),
            )
            .map((availableUser) => ({
              userId: String(availableUser.userId),
              username: availableUser.username || "User",
              profileImage: availableUser.profileImage || "",
            }));

          setAvailableDmUsers((currentUsers) =>
            Array.from(
              new Map(
                [...currentUsers, ...onlinePeers].map((availableUser) => [
                  availableUser.userId,
                  availableUser,
                ]),
              ).values(),
            ),
          );
          setOnlineUserKeys(
            new Set(
              onlinePeers.flatMap((availableUser) => [
                `id:${availableUser.userId}`,
                presenceNameKey(availableUser.username),
              ]).filter(Boolean),
            ),
          );
        })
        .catch((error) => {
          console.error(
            "[users] online_error",
            error.response?.data?.message ?? error.message,
          );
        });
    }

    function handleDisconnect(reason) {
      console.info("[socket] disconnect", reason);
      joinedRoomRef.current = null;
      setSocketConnected(false);
      seenEmissionIdsRef.current = new Set();
      clearTypingTimeout();
      isTypingRef.current = false;
      typingRoomRef.current = null;
      setTypingSocketIds(new Set());
      setOnlineUserKeys(new Set());
      setActiveRoomMemberSocketIds(new Set());
      setActiveRoomMembers([]);
      if (reason === "io server disconnect") socket.connect();
    }

    function handleConnectError(error) {
      console.error("[socket] connect_error", error?.message ?? error);
    }

    function handleSocketError(error) {
      console.error("[socket] error", error?.message ?? error);
      setAttachmentError(error?.message ?? "Unable to send message.");
    }

    function handleReceiveMessage(incomingMessage) {
      const message = normalizeSocketMessage(incomingMessage, currentUserId);

      if (!message || receivedSocketMessageIdsRef.current.has(message.id)) {
        return;
      }
      if (hiddenMessageIdsRef.current.has(message.backendId)) return;

      if (
        message.direction === "incoming" &&
        deletedConversationRoomsRef.current.has(message.room)
      ) {
        restoreDeletedConversation(message.room);
      }

      receivedSocketMessageIdsRef.current.add(message.id);

      console.info("[socket] receive", {
        room: message.room,
        id: message.id,
      });

      updateRoomLatestMessage(message);

      if (
        message.isPrivate &&
        message.senderId != null &&
        String(message.senderId) !== String(currentUserId)
      ) {
        setDmConversationUserIds((currentIds) => {
          if (currentIds.has(message.senderId)) return currentIds;
          const nextIds = new Set(currentIds);
          nextIds.add(message.senderId);
          return nextIds;
        });
        setAvailableDmUsers((currentUsers) =>
          currentUsers.some(
            (availableUser) => availableUser.userId === message.senderId,
          )
            ? currentUsers
            : [
                ...currentUsers,
                {
                  userId: message.senderId,
                  username: message.senderUsername || "User",
                },
              ],
        );
      }

      const isActiveRoom = String(message.room) === activeRoomRef.current;
      const isIncomingFromOtherUser =
        message.direction === "incoming" &&
        message.senderId != null &&
        String(message.senderId) !== String(currentUserId);

      if (
        isIncomingFromOtherUser &&
        (!isActiveRoom || !isNearBottomRef.current)
      ) {
        incrementRoomUnread(message.room);
      }

      if (!isActiveRoom) return;

      setChatMessages((currentMessages) =>
        currentMessages.some((currentMessage) => currentMessage.id === message.id)
          ? currentMessages
          : (() => {
              shouldAutoScrollNewMessageRef.current =
                isNearBottomRef.current;
              return [...currentMessages, message];
            })(),
      );
    }

    function handleMessageStatusUpdate({ room, messageIds = [], status } = {}) {
      if (
        !room ||
        !MESSAGE_STATUS_RANK[status] ||
        !Array.isArray(messageIds)
      ) {
        return;
      }

      const normalizedIds = new Set(
        messageIds.map((messageId) => `socket-${messageId}`),
      );

      setChatMessages((currentMessages) =>
        currentMessages.map((message) => {
          if (!normalizedIds.has(message.id)) return message;

          const nextStatus = latestMessageStatus(message.status, status);
          return nextStatus === message.status
            ? message
            : { ...message, status: nextStatus };
        }),
      );

      setRoomSummaries((currentSummaries) => {
        const roomSummary = currentSummaries[room];
        const latestMessage = roomSummary?.latestMessage;

        if (!latestMessage || !normalizedIds.has(latestMessage.id)) {
          return currentSummaries;
        }

        const nextStatus = latestMessageStatus(latestMessage.status, status);
        if (nextStatus === latestMessage.status) return currentSummaries;

        return {
          ...currentSummaries,
          [room]: {
            ...roomSummary,
            latestMessage: { ...latestMessage, status: nextStatus },
          },
        };
      });
    }

    function handleMessageEdited(updatedMessage) {
      const normalized = normalizeSocketMessage(updatedMessage, currentUserId);
      if (!normalized) return;

      setChatMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === normalized.id ? { ...message, ...normalized } : message,
        ),
      );
      updateRoomLatestMessage(normalized);
    }

    function handleMessageDeleted({ id, room } = {}) {
      if (!id) return;
      removeMessageFromUi(String(id), room);
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
      const normalizedReactions = normalizeMessageReactions(reactions);
      const incomingReactionState = {
        reactions: normalizedReactions,
        reactionsUpdatedAt,
      };

      setChatMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === normalizedId
            ? {
                ...message,
                ...getNewestReactionState(message, incomingReactionState),
              }
            : message,
        ),
      );
      setRoomSummaries((currentSummaries) => {
        const summary = currentSummaries[room] ?? {
          unreadCount: 0,
          latestMessage: null,
        };
        let latestReaction = summary.latestReaction ?? null;
        const activityTime = new Date(activity?.createdAt || 0).getTime();
        const latestActivityTime = new Date(
          latestReaction?.createdAt || 0,
        ).getTime();

        if (
          activity?.action === "added" &&
          String(activity.targetSenderId) === String(currentUserId) &&
          String(activity.userId) !== String(currentUserId) &&
          activityTime >= latestActivityTime
        ) {
          latestReaction = { ...activity, messageId: String(messageId) };
        } else if (
          activity?.action === "removed" &&
          latestReaction?.messageId === String(messageId) &&
          latestReaction?.emoji === activity.emoji &&
          String(latestReaction?.userId) === String(activity.userId) &&
          activityTime >= latestActivityTime
        ) {
          latestReaction = null;
        }

        const latestMessage =
          summary.latestMessage?.id === normalizedId
            ? {
                ...summary.latestMessage,
                ...getNewestReactionState(
                  summary.latestMessage,
                  incomingReactionState,
                ),
              }
            : summary.latestMessage;

        if (
          latestMessage === summary.latestMessage &&
          latestReaction === summary.latestReaction
        ) {
          return currentSummaries;
        }

        return {
          ...currentSummaries,
          [room]: {
            ...summary,
            latestMessage,
            latestReaction,
          },
        };
      });
    }

    function handleTypingStart({ room, socketId } = {}) {
      if (
        String(room) !== activeRoomRef.current ||
        !socketId ||
        socketId === socket.id
      ) {
        return;
      }

      setTypingSocketIds((currentSocketIds) => {
        if (currentSocketIds.has(socketId)) return currentSocketIds;

        const nextSocketIds = new Set(currentSocketIds);
        nextSocketIds.add(socketId);
        return nextSocketIds;
      });
    }

    function handleTypingStop({ room, socketId } = {}) {
      if (String(room) !== activeRoomRef.current || !socketId) return;

      setTypingSocketIds((currentSocketIds) => {
        if (!currentSocketIds.has(socketId)) return currentSocketIds;

        const nextSocketIds = new Set(currentSocketIds);
        nextSocketIds.delete(socketId);
        return nextSocketIds;
      });
    }

    function handleRoomJoined({ room } = {}) {
      if (String(room) !== activeRoomRef.current) return;
      socket.emit("request_members", { room });
    }

    function handleRoomMembers({ room, members = [] } = {}) {
      if (String(room) !== activeRoomRef.current) return;

      const otherMembers = members.filter(
        (member) =>
          member.socketId !== socket.id &&
          String(member.userId) !== String(currentUserId),
      );
      setActiveRoomMemberSocketIds(
        new Set(
          otherMembers
            .map((member) => member.socketId)
            .filter(Boolean),
        ),
      );
      setActiveRoomMembers(otherMembers);
    }

    function handleUserJoined({
      room,
      socketId,
      userId,
      username,
      profileImage,
    } = {}) {
      if (
        String(room) !== activeRoomRef.current ||
        !socketId ||
        socketId === socket.id
      ) {
        return;
      }

      setActiveRoomMemberSocketIds((currentSocketIds) => {
        if (currentSocketIds.has(socketId)) return currentSocketIds;

        const nextSocketIds = new Set(currentSocketIds);
        nextSocketIds.add(socketId);
        return nextSocketIds;
      });
      if (userId != null && String(userId) !== String(currentUserId)) {
        setActiveRoomMembers((currentMembers) =>
          currentMembers.some((member) => member.socketId === socketId)
            ? currentMembers
            : [
                ...currentMembers,
                {
                  socketId,
                  userId: String(userId),
                  username,
                  profileImage: profileImage || "",
                },
              ],
        );
      }
    }

    function handleUserLeft({ room, socketId } = {}) {
      if (String(room) !== activeRoomRef.current || !socketId) return;

      setActiveRoomMemberSocketIds((currentSocketIds) => {
        if (!currentSocketIds.has(socketId)) return currentSocketIds;

        const nextSocketIds = new Set(currentSocketIds);
        nextSocketIds.delete(socketId);
        return nextSocketIds;
      });
      setActiveRoomMembers((currentMembers) =>
        currentMembers.filter((member) => member.socketId !== socketId),
      );
    }

    function handleUserOnline({ userId, username, profileImage } = {}) {
      if (userId != null && String(userId) === String(currentUserId)) return;

      if (userId != null) {
        setAvailableDmUsers((currentUsers) => {
          const normalizedUserId = String(userId);
          const existingIndex = currentUsers.findIndex(
            (availableUser) => availableUser.userId === normalizedUserId,
          );

          if (existingIndex === -1) {
            return [
              ...currentUsers,
              {
                userId: normalizedUserId,
                username: username || "User",
                profileImage: profileImage || "",
              },
            ];
          }

          if (
            (!username || currentUsers[existingIndex].username === username) &&
            (profileImage === undefined ||
              currentUsers[existingIndex].profileImage === profileImage)
          ) {
            return currentUsers;
          }

          return currentUsers.map((availableUser, index) =>
            index === existingIndex
              ? {
                  ...availableUser,
                  username,
                  profileImage:
                    profileImage ?? availableUser.profileImage ?? "",
                }
              : availableUser,
          );
        });
      }

      setOnlineUserKeys((currentKeys) => {
        const nextKeys = new Set(currentKeys);
        if (userId != null) nextKeys.add(`id:${userId}`);

        const nameKey = presenceNameKey(username);
        if (nameKey) nextKeys.add(nameKey);

        return nextKeys.size === currentKeys.size ? currentKeys : nextKeys;
      });
    }

    function handleUserOffline({ userId, username } = {}) {
      setOnlineUserKeys((currentKeys) => {
        const nextKeys = new Set(currentKeys);
        if (userId != null) nextKeys.delete(`id:${userId}`);

        const nameKey = presenceNameKey(username);
        if (nameKey) nextKeys.delete(nameKey);

        return nextKeys.size === currentKeys.size ? currentKeys : nextKeys;
      });
    }

    function handleUserProfileUpdated({
      userId,
      username,
      profileImage,
    } = {}) {
      if (userId == null) return;
      const normalizedUserId = String(userId);
      const profileChanges = {
        username: username || "User",
        profileImage: profileImage || "",
      };

      setAvailableDmUsers((currentUsers) =>
        currentUsers.map((availableUser) =>
          availableUser.userId === normalizedUserId
            ? { ...availableUser, ...profileChanges }
            : availableUser,
        ),
      );
      setActiveRoomMembers((currentMembers) =>
        currentMembers.map((member) =>
          String(member.userId) === normalizedUserId
            ? { ...member, ...profileChanges }
            : member,
        ),
      );
      setActiveProfileChat((currentChat) =>
        String(currentChat?.recipientId) === normalizedUserId
          ? {
              ...currentChat,
              name: profileChanges.username,
              initials: getUserInitials(profileChanges.username),
              imageSrc: resolveUploadedFileUrl(profileChanges.profileImage),
            }
          : currentChat,
      );
      setOnlineUserKeys((currentKeys) => {
        const nextKeys = new Set(currentKeys);
        nextKeys.add(`id:${normalizedUserId}`);
        const nameKey = presenceNameKey(profileChanges.username);
        if (nameKey) nextKeys.add(nameKey);
        return nextKeys;
      });
      setFriendsRefreshVersion((version) => version + 1);
    }

    function handleFriendsUpdated(notification) {
      setFriendsRefreshVersion((version) => version + 1);

      if (
        notification?.type !== "friend_request_accepted" ||
        !notification.requestId ||
        !notification.user?.userId
      ) {
        return;
      }

      const acceptedNotification = {
        id: `friend-accepted:${notification.requestId}`,
        type: notification.type,
        requestId: String(notification.requestId),
        userId: String(notification.user.userId),
        username: notification.user.username || "User",
        createdAt: notification.createdAt || new Date().toISOString(),
      };

      setFriendActivityNotifications((currentNotifications) =>
        currentNotifications.some(
          (currentNotification) =>
            currentNotification.id === acceptedNotification.id,
        )
          ? currentNotifications
          : [acceptedNotification, ...currentNotifications],
      );
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("socket_error", handleSocketError);
    socket.on("error", handleSocketError);
    socket.on("new_message", handleReceiveMessage);
    socket.on("message_notification", handleReceiveMessage);
    socket.on("message_status_update", handleMessageStatusUpdate);
    socket.on("message_edited", handleMessageEdited);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("message_reactions_updated", handleMessageReactionsUpdated);
    socket.on("typing_start", handleTypingStart);
    socket.on("typing_stop", handleTypingStop);
    socket.on("room_joined", handleRoomJoined);
    socket.on("room_members", handleRoomMembers);
    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("friends_updated", handleFriendsUpdated);
    socket.on("user_profile_updated", handleUserProfileUpdated);

    return () => {
      stopTyping();
      if (socket.connected && joinedRoomRef.current) {
        socket.emit("leave_room", { room: joinedRoomRef.current });
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("socket_error", handleSocketError);
      socket.off("error", handleSocketError);
      socket.off("new_message", handleReceiveMessage);
      socket.off("message_notification", handleReceiveMessage);
      socket.off("message_status_update", handleMessageStatusUpdate);
      socket.off("message_edited", handleMessageEdited);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("message_reactions_updated", handleMessageReactionsUpdated);
      socket.off("typing_start", handleTypingStart);
      socket.off("typing_stop", handleTypingStop);
      socket.off("room_joined", handleRoomJoined);
      socket.off("room_members", handleRoomMembers);
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("friends_updated", handleFriendsUpdated);
      socket.off("user_profile_updated", handleUserProfileUpdated);
      socket.disconnect();
      socketRef.current = null;
      joinedRoomRef.current = null;
    };
  }, [currentUserId, user?.profileImage, user?.username]);

  useEffect(() => {
    if (!activeRoom) return undefined;

    const controller = new AbortController();
    const generation = historyGenerationRef.current + 1;
    historyGenerationRef.current = generation;
    oldestPageRef.current = null;
    hasOlderMessagesRef.current = false;
    olderRequestInFlightRef.current = false;
    isNearBottomRef.current = true;
    setLoadingOlderMessages(false);

    async function loadRoomHistory() {
      try {
        const latestPage = activeDmRecipientId
          ? await getLatestPrivateMessagePage(activeDmRecipientId, {
              signal: controller.signal,
            })
          : await getLatestRoomMessagePage(activeRoom, {
              signal: controller.signal,
            });
        if (generation !== historyGenerationRef.current) return;

        const history = latestPage.messages
          .map((message) => normalizeSocketMessage(message, currentUserId))
          .filter(
            (message) =>
              message &&
              String(message.room) === String(activeRoom) &&
              !hiddenMessageIdsRef.current.has(message.backendId),
          );

        if (history.length > 0) {
          updateRoomLatestMessage(history[history.length - 1]);
        }

        oldestPageRef.current = latestPage.page;
        hasOlderMessagesRef.current = latestPage.page > 1;
        initialScrollPendingRef.current = true;

        setChatMessages((currentMessages) => {
          const mergedMessages = [...history];

          currentMessages
            .filter(
              (message) => String(message.room) === String(activeRoom),
            )
            .forEach((message) => {
              const existingIndex = mergedMessages.findIndex(
                (currentMessage) => currentMessage.id === message.id,
              );

              if (existingIndex === -1) {
                mergedMessages.push(message);
              } else {
                const existingMessage = mergedMessages[existingIndex];
                mergedMessages[existingIndex] = {
                  ...existingMessage,
                  status: latestMessageStatus(
                    existingMessage.status,
                    message.status,
                  ),
                  ...getNewestReactionState(existingMessage, message),
                };
              }
            });

          return mergedMessages;
        });
      } catch (error) {
        if (
          generation === historyGenerationRef.current &&
          error.code !== "ERR_CANCELED"
        ) {
          console.error(
            "[rooms] history_error",
            error.response?.data?.message ?? error.message,
          );
        }
      }
    }

    loadRoomHistory();

    return () => {
      controller.abort();
    };
  }, [activeDmRecipientId, activeRoom, currentUserId]);

  useEffect(() => {
    function handleVisibilityChange() {
      setPageVisible(document.visibilityState === "visible");
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTimeNow(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const room = pendingActiveRoomSeenRef.current;
    const socket = socketRef.current;

    if (
      room !== activeRoom ||
      !socketConnected ||
      !socket?.connected ||
      joinedRoomRef.current !== room
    ) {
      return;
    }

    const unreadCount = Math.max(
      0,
      Number(roomSummaries?.[room]?.unreadCount) || 0,
    );

    pendingActiveRoomSeenRef.current = null;

    if (unreadCount > 0) {
      socket.emit("mark_seen", { room });
      clearRoomUnread(room);
    }
  }, [activeRoom, roomSummaries, socketConnected]);

  useEffect(() => {
    markVisibleMessagesSeen();
  }, [activeRoom, chatMessages, currentUserId, pageVisible, socketConnected]);

  useLayoutEffect(() => {
    const container = messagesScrollRef.current;
    if (!container) return;

    const typingStarted = typingSocketIds.size > 0 && !wasTypingRef.current;
    wasTypingRef.current = typingSocketIds.size > 0;

    if (initialScrollPendingRef.current) {
      initialScrollPendingRef.current = false;
      container.scrollTop = container.scrollHeight;
      isNearBottomRef.current = true;
      return;
    }

    if (prependScrollSnapshotRef.current) {
      const { scrollHeight, scrollTop } = prependScrollSnapshotRef.current;
      prependScrollSnapshotRef.current = null;
      container.scrollTop =
        scrollTop + (container.scrollHeight - scrollHeight);
      return;
    }

    if (
      shouldAutoScrollNewMessageRef.current ||
      (typingStarted && isNearBottomRef.current)
    ) {
      shouldAutoScrollNewMessageRef.current = false;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, typingSocketIds]);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  function updateRoomLatestMessage(message) {
    if (!message?.room) return;

    setRoomSummaries((currentSummaries) => {
      const roomSummary = currentSummaries[message.room] ?? {
        unreadCount: 0,
        latestMessage: null,
      };

      if (!isLaterMessage(message, roomSummary.latestMessage)) {
        return currentSummaries;
      }

      const latestMessage =
        roomSummary.latestMessage?.id === message.id
          ? {
              ...message,
              status: latestMessageStatus(
                roomSummary.latestMessage.status,
                message.status,
              ),
              ...getNewestReactionState(message, roomSummary.latestMessage),
            }
          : message;

      return {
        ...currentSummaries,
        [message.room]: { ...roomSummary, latestMessage },
      };
    });
  }

  function removeMessageFromUi(backendId, room) {
    const normalizedId = `socket-${backendId}`;
    setChatMessages((currentMessages) => {
      const removedMessage = currentMessages.find(
        (message) => message.id === normalizedId,
      );
      const remainingMessages = currentMessages.filter(
        (message) => message.id !== normalizedId,
      );

      if (removedMessage) {
        const latestRemaining = [...remainingMessages]
          .reverse()
          .find((message) => message.room === (room || removedMessage.room));
        setRoomSummaries((currentSummaries) => {
          const summary = currentSummaries[room || removedMessage.room];
          const removesLatestMessage = summary?.latestMessage?.id === normalizedId;
          const removesLatestReaction =
            summary?.latestReaction?.messageId === String(backendId);
          if (!removesLatestMessage && !removesLatestReaction) {
            return currentSummaries;
          }
          return {
            ...currentSummaries,
            [room || removedMessage.room]: {
              ...summary,
              latestMessage: removesLatestMessage
                ? latestRemaining || null
                : summary.latestMessage,
              latestReaction: removesLatestReaction
                ? null
                : summary.latestReaction,
            },
          };
        });
      }

      return remainingMessages;
    });
    setEditingMessage((currentMessage) =>
      currentMessage?.backendId === backendId ? null : currentMessage,
    );
    setReplyingTo((currentMessage) =>
      currentMessage?.backendId === backendId ? null : currentMessage,
    );
  }

  function incrementRoomUnread(room) {
    if (!room) return;

    setRoomSummaries((currentSummaries) => {
      const roomSummary = currentSummaries[room] ?? {
        unreadCount: 0,
        latestMessage: null,
      };
      const currentUnreadCount = Number(roomSummary.unreadCount);
      const safeUnreadCount = Number.isFinite(currentUnreadCount)
        ? Math.max(0, Math.floor(currentUnreadCount))
        : 0;

      return {
        ...currentSummaries,
        [room]: {
          ...roomSummary,
          unreadCount: safeUnreadCount + 1,
        },
      };
    });
  }

  function clearRoomUnread(room) {
    if (!room) return;

    setRoomSummaries((currentSummaries) => {
      const roomSummary = currentSummaries[room];
      if (!roomSummary || Number(roomSummary.unreadCount) === 0) {
        return currentSummaries;
      }

      return {
        ...currentSummaries,
        [room]: { ...roomSummary, unreadCount: 0 },
      };
    });
  }

  function clearTypingTimeout() {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }

  function stopTyping() {
    clearTypingTimeout();

    if (!isTypingRef.current) return;

    const socket = socketRef.current;
    const room = typingRoomRef.current;

    if (socket?.connected && room) {
      socket.emit("typing_stop", { room });
    }

    isTypingRef.current = false;
    typingRoomRef.current = null;
  }

  function handleMessageChange(event) {
    const value = event.target.value;
    setMessageValue(value);
    clearTypingTimeout();

    if (!value.trim()) {
      stopTyping();
      return;
    }

    const socket = socketRef.current;
    const room = activeRoomRef.current;

    if (!socket?.connected) return;

    if (!isTypingRef.current || typingRoomRef.current !== room) {
      stopTyping();
      socket.emit("typing_start", { room });
      isTypingRef.current = true;
      typingRoomRef.current = room;
    }

    typingTimeoutRef.current = setTimeout(stopTyping, 700);
  }

  async function loadOlderMessages() {
    const currentPage = oldestPageRef.current;

    if (
      olderRequestInFlightRef.current ||
      !hasOlderMessagesRef.current ||
      currentPage === null ||
      currentPage <= 1
    ) {
      return;
    }

    const room = activeRoomRef.current;
    const page = currentPage - 1;
    const generation = historyGenerationRef.current;
    olderRequestInFlightRef.current = true;
    setLoadingOlderMessages(true);

    try {
      const recipientId = activeDmRecipientIdRef.current;
      const historyPage = recipientId
        ? await getPrivateMessagePage(recipientId, page)
        : await getRoomMessagePage(room, page);

      if (
        generation !== historyGenerationRef.current ||
        room !== activeRoomRef.current
      ) {
        return;
      }

      const olderMessages = historyPage.messages
        .map((message) => normalizeSocketMessage(message, currentUserId))
        .filter(
          (message) =>
            message &&
            String(message.room) === String(room) &&
            !hiddenMessageIdsRef.current.has(message.backendId),
        );

      oldestPageRef.current = page;
      hasOlderMessagesRef.current = page > 1;

      setChatMessages((currentMessages) => {
        const currentIds = new Set(
          currentMessages.map((message) => message.id),
        );
        const uniqueOlderMessages = olderMessages.filter(
          (message) => !currentIds.has(message.id),
        );

        if (uniqueOlderMessages.length === 0) return currentMessages;

        const container = messagesScrollRef.current;
        if (container) {
          prependScrollSnapshotRef.current = {
            scrollHeight: container.scrollHeight,
            scrollTop: container.scrollTop,
          };
        }

        return [...uniqueOlderMessages, ...currentMessages];
      });
    } catch (error) {
      if (generation === historyGenerationRef.current) {
        console.error(
          "[rooms] older_history_error",
          error.response?.data?.message ?? error.message,
        );
      }
    } finally {
      if (generation === historyGenerationRef.current) {
        olderRequestInFlightRef.current = false;
        setLoadingOlderMessages(false);
      }
    }
  }

  function handleMessagesScroll(event) {
    const container = event.currentTarget;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    isNearBottomRef.current = distanceFromBottom < 120;

    if (container.scrollTop < 120) {
      loadOlderMessages();
    }

    markVisibleMessagesSeen();
  }

  function markVisibleMessagesSeen() {
    const socket = socketRef.current;
    const container = messagesScrollRef.current;

    if (
      !pageVisible ||
      !socketConnected ||
      !socket?.connected ||
      !container ||
      joinedRoomRef.current !== activeRoom
    ) {
      return;
    }

    const incomingFromOtherUserIds = new Set(
      chatMessages
        .filter(
          (message) =>
            String(message.room) === String(activeRoom) &&
            message.direction === "incoming" &&
            message.senderId != null &&
            String(message.senderId) !== String(currentUserId),
        )
        .map((message) => message.id),
    );

    if (incomingFromOtherUserIds.size === 0) return;

    const containerBounds = container.getBoundingClientRect();
    const visibleMessageIds = Array.from(
      container.querySelectorAll("[data-message-id]"),
    )
      .filter((element) => {
        const bounds = element.getBoundingClientRect();
        return (
          bounds.bottom > containerBounds.top &&
          bounds.top < containerBounds.bottom
        );
      })
      .map((element) => element.dataset.messageId)
      .filter((messageId) => incomingFromOtherUserIds.has(messageId));

    if (visibleMessageIds.length === 0) return;

    clearRoomUnread(activeRoom);

    const unseenVisibleMessageIds = visibleMessageIds.filter((messageId) => {
      const message = chatMessages.find(
        (currentMessage) => currentMessage.id === messageId,
      );

      return (
        message?.status !== "seen" &&
        !seenEmissionIdsRef.current.has(messageId)
      );
    });

    if (unseenVisibleMessageIds.length === 0) return;

    unseenVisibleMessageIds.forEach((messageId) => {
      seenEmissionIdsRef.current.add(messageId);
    });
    socket.emit("mark_seen", { room: activeRoom });
  }

  function clearRecordingTimer() {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }

  function stopMicrophoneTracks() {
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
  }

  function cancelVoiceRecording({ updateState = true } = {}) {
    recordingSessionRef.current += 1;
    voiceSendPendingRef.current = false;
    clearRecordingTimer();

    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;

    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // The tracks are stopped below even if the recorder is already closing.
      }
    }

    stopMicrophoneTracks();

    if (updateState) {
      setRecordingState("idle");
      setRecordingDuration(0);
    }
  }

  async function handleStartVoiceRecording() {
    if (sendInFlightRef.current || recordingState === "recording") return;

    if (
      typeof MediaRecorder === "undefined" ||
      typeof MediaRecorder.isTypeSupported !== "function" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setAttachmentError("Voice recording is not supported in this browser.");
      return;
    }

    const mimeType = getVoiceMimeType();
    if (!mimeType) {
      setAttachmentError("This browser does not support a compatible audio format.");
      return;
    }

    cancelVoiceRecording();
    voiceSendPendingRef.current = false;
    setSelectedFile(null);
    setAttachmentError("");
    setRecordingState("processing");
    const session = recordingSessionRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      if (session !== recordingSessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const chunks = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      });

      recorder.addEventListener("error", () => {
        if (session !== recordingSessionRef.current) return;

        recordingSessionRef.current += 1;
        voiceSendPendingRef.current = false;
        clearRecordingTimer();
        stopMicrophoneTracks();
        mediaRecorderRef.current = null;
        setRecordingState("idle");
        setRecordingDuration(0);
        setAttachmentError("Voice recording failed. Please try again.");
      });

      recorder.addEventListener("stop", () => {
        clearRecordingTimer();
        stopMicrophoneTracks();
        if (session !== recordingSessionRef.current) return;

        mediaRecorderRef.current = null;
        if (!voiceSendPendingRef.current) {
          setRecordingState("idle");
          setRecordingDuration(0);
          setAttachmentError("Voice recording stopped before it could be sent.");
          return;
        }

        const audioMimeType = (recorder.mimeType || mimeType).split(";")[0];
        const blob = new Blob(chunks, { type: audioMimeType });

        if (!blob.size) {
          voiceSendPendingRef.current = false;
          setRecordingState("idle");
          setRecordingDuration(0);
          setAttachmentError("No audio was recorded. Please try again.");
          return;
        }

        const extension = getVoiceFileExtension(audioMimeType);
        const file = new File(
          [blob],
          `voice-message-${Date.now()}.${extension}`,
          { type: audioMimeType },
        );

        void handleMessageSend("", { file, voice: true });
      });

      recordingStartedAtRef.current = Date.now();
      setRecordingDuration(0);
      setRecordingState("recording");
      recorder.start(250);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(
          Math.floor((Date.now() - recordingStartedAtRef.current) / 1000),
        );
      }, 250);
    } catch (error) {
      if (session !== recordingSessionRef.current) return;

      voiceSendPendingRef.current = false;
      clearRecordingTimer();
      stopMicrophoneTracks();
      mediaRecorderRef.current = null;
      setRecordingState("idle");
      setRecordingDuration(0);

      if (error?.name === "NotAllowedError") {
        setAttachmentError("Microphone permission was denied.");
      } else if (error?.name === "NotFoundError") {
        setAttachmentError("No microphone was found.");
      } else {
        setAttachmentError("Unable to start voice recording.");
      }
    }
  }

  function handleStopVoiceRecording() {
    const recorder = mediaRecorderRef.current;
    if (
      !recorder ||
      recorder.state === "inactive" ||
      voiceSendPendingRef.current
    ) {
      return;
    }

    voiceSendPendingRef.current = true;
    clearRecordingTimer();
    setRecordingDuration(
      Math.floor((Date.now() - recordingStartedAtRef.current) / 1000),
    );
    setRecordingState("processing");

    try {
      recorder.stop();
    } catch {
      cancelVoiceRecording();
      setAttachmentError("Unable to finish voice recording.");
    }

    stopMicrophoneTracks();
  }

  function handleCancelVoiceRecording() {
    if (sendInFlightRef.current) return;
    cancelVoiceRecording();
    setAttachmentError("");
  }

  useEffect(
    () => () => {
      cancelVoiceRecording({ updateState: false });
    },
    [],
  );

  function handleChatSelect(chat) {
    const room = chat?.room;
    const recipientId = chat?.recipientId ?? null;

    if (
      recipientId != null &&
      String(recipientId) === String(currentUserId)
    ) {
      return;
    }

    if (!room || room === activeRoomRef.current) return;

    stopTyping();
    setTypingSocketIds(new Set());
    setActiveRoomMemberSocketIds(new Set());
    setActiveRoomMembers([]);
    seenEmissionIdsRef.current = new Set();
    pendingActiveRoomSeenRef.current = room;
    historyGenerationRef.current += 1;
    oldestPageRef.current = null;
    hasOlderMessagesRef.current = false;
    olderRequestInFlightRef.current = false;
    initialScrollPendingRef.current = false;
    prependScrollSnapshotRef.current = null;
    shouldAutoScrollNewMessageRef.current = false;
    isNearBottomRef.current = true;
    setLoadingOlderMessages(false);

    const socket = socketRef.current;
    const joinedRoom = joinedRoomRef.current;

    if (socket?.connected && joinedRoom) {
      socket.emit("leave_room", { room: joinedRoom });
      joinedRoomRef.current = null;
    }

    activeRoomRef.current = room;
    activeDmRecipientIdRef.current = recipientId;

    if (socket?.connected) {
      socket.emit("join_room", { room });
      joinedRoomRef.current = room;
    }

    setActiveRoom(room);
    setActiveDmRecipientId(recipientId);
    setChatMessages([]);
    setEditingMessage(null);
    setReplyingTo(null);
    setReactionDetailsMessageId(null);
    setMessageValue("");
    cancelVoiceRecording();
    setSelectedFile(null);
    setAttachmentError("");
  }

  async function handleToggleConversationPin(room) {
    if (!room) return;

    const previousPins = pinnedConversations;
    const isPinned = previousPins.some(
      (conversation) => conversation.room === room,
    );
    setPinnedConversations(
      isPinned
        ? previousPins.filter((conversation) => conversation.room !== room)
        : [{ room, pinnedAt: new Date().toISOString() }, ...previousPins],
    );

    try {
      const savedPins = await setConversationPin(room, !isPinned);
      setPinnedConversations(savedPins);
    } catch (error) {
      setPinnedConversations(previousPins);
      console.error(
        "[conversation-pins] update_error",
        error.response?.data?.error ?? error.message,
      );
    }
  }

  async function handleRequestMuteConversation(chat) {
    if (!chat?.room) return;
    if (!isMutedConversation(chat.room)) {
      setMuteConfirmation(chat);
      return;
    }

    try {
      setMutedConversations(await setConversationMute(chat.room, false));
    } catch (error) {
      console.error(
        "[conversation-mutes] update_error",
        error.response?.data?.error ?? error.message,
      );
    }
  }

  async function handleMuteDuration(duration) {
    const chat = muteConfirmation;
    if (!chat?.room) return;

    try {
      setMutedConversations(
        await setConversationMute(chat.room, true, duration),
      );
      setMuteConfirmation(null);
    } catch (error) {
      console.error(
        "[conversation-mutes] update_error",
        error.response?.data?.error ?? error.message,
      );
    }
  }

  function restoreDeletedConversation(room) {
    if (!room || !deletedConversationRoomsRef.current.has(room)) return;

    deletedConversationRoomsRef.current.delete(room);
    setDeletedConversations((currentConversations) =>
      currentConversations.filter((conversation) => conversation.room !== room),
    );
    setConversationDeletion(room, false).catch((error) => {
      console.error(
        "[conversation-deletions] restore_error",
        error.response?.data?.error ?? error.message,
      );
    });
  }

  function clearConversationFromUi(chat) {
    const room = chat?.room;
    if (!room) return;

    setPinnedConversations((currentPins) =>
      currentPins.filter((conversation) => conversation.room !== room),
    );
    setRoomSummaries((currentSummaries) => {
      const { [room]: removedSummary, ...remainingSummaries } = currentSummaries;
      return removedSummary ? remainingSummaries : currentSummaries;
    });
    setChatMessages((currentMessages) =>
      currentMessages.filter((message) => message.room !== room),
    );
    setReadNotificationIds((currentIds) => {
      const notificationId = `conversation:${room}`;
      if (!currentIds.has(notificationId)) return currentIds;
      const nextIds = new Set(currentIds);
      nextIds.delete(notificationId);
      return nextIds;
    });
    if (chat.recipientId) {
      setDmConversationUserIds((currentIds) => {
        if (!currentIds.has(chat.recipientId)) return currentIds;
        const nextIds = new Set(currentIds);
        nextIds.delete(chat.recipientId);
        return nextIds;
      });
    }
    if (activeProfileChat?.room === room) setActiveProfileChat(null);

    if (activeRoomRef.current !== room) return;

    stopTyping();
    const socket = socketRef.current;
    if (socket?.connected && joinedRoomRef.current === room) {
      socket.emit("leave_room", { room });
      joinedRoomRef.current = null;
    }
    activeRoomRef.current = null;
    activeDmRecipientIdRef.current = null;
    pendingActiveRoomSeenRef.current = null;
    historyGenerationRef.current += 1;
    setActiveRoom(null);
    setActiveDmRecipientId(null);
    setActiveRoomMembers([]);
    setActiveRoomMemberSocketIds(new Set());
    setTypingSocketIds(new Set());
    setChatMessages([]);
    setEditingMessage(null);
    setReplyingTo(null);
    setReactionDetailsMessageId(null);
    setMessageValue("");
    cancelVoiceRecording();
    setSelectedFile(null);
    setAttachmentError("");
  }

  function handleRequestDeleteConversation(chat) {
    if (!chat?.room) return;
    setDeleteConversationError("");
    setDeleteConfirmation(chat);
  }

  async function handleConfirmDeleteConversation() {
    const chat = deleteConfirmation;
    if (!chat?.room || deletingConversation) return;

    setDeletingConversation(true);
    setDeleteConversationError("");
    try {
      const savedDeletions = await setConversationDeletion(chat.room, true);
      deletedConversationRoomsRef.current.add(chat.room);
      setDeletedConversations(savedDeletions);
      clearConversationFromUi(chat);
      setDeleteConfirmation(null);
    } catch (error) {
      setDeleteConversationError(
        error.response?.data?.error ??
          error.message ??
          "Unable to delete this conversation.",
      );
    } finally {
      setDeletingConversation(false);
    }
  }

  function handleSectionChange(section) {
    if (
      [
        "rooms",
        "dms",
        "friends",
        "notifications",
        "profile",
        "settings",
      ].includes(section)
    ) {
      if (section === "friends") setFriendsInitialTab("friends");
      setActiveSection(section);
    }
  }

  function handleNotificationPreferenceChange(key, enabled) {
    setNotificationPreferences((currentPreferences) => {
      const nextPreferences = { ...currentPreferences, [key]: enabled };
      saveNotificationPreferences(nextPreferences);
      return nextPreferences;
    });
  }

  function handleMessageUser(chat) {
    const recipientId = chat?.recipientId;
    if (
      recipientId == null ||
      String(recipientId) === String(currentUserId)
    ) {
      return;
    }

    const normalizedRecipientId = String(recipientId);
    const room = chat.room ?? getDmRoomId(currentUserId, normalizedRecipientId);
    restoreDeletedConversation(room);
    setAvailableDmUsers((currentUsers) =>
      currentUsers.some(
        (availableUser) => availableUser.userId === normalizedRecipientId,
      )
        ? currentUsers
        : [
            ...currentUsers,
            { userId: normalizedRecipientId, username: chat.name || "User" },
          ],
    );
    setDmConversationUserIds((currentIds) => {
      if (currentIds.has(normalizedRecipientId)) return currentIds;
      const nextIds = new Set(currentIds);
      nextIds.add(normalizedRecipientId);
      return nextIds;
    });
    setActiveSection("dms");
    handleChatSelect({
      ...chat,
      room,
      recipientId: normalizedRecipientId,
    });
  }

  function handleOpenNotification(notification) {
    setReadNotificationIds((currentIds) => {
      if (currentIds.has(notification.id)) return currentIds;
      const nextIds = new Set(currentIds);
      nextIds.add(notification.id);
      return nextIds;
    });

    if (notification.type === "friend_request") {
      setFriendsInitialTab("incoming");
      setActiveSection("friends");
      return;
    }

    if (notification.type === "friend_request_accepted") {
      setFriendsInitialTab("friends");
      setActiveSection("friends");
      return;
    }

    const chat = notification.chat;
    if (!chat?.room) return;

    if (chat.room === activeRoomRef.current) {
      socketRef.current?.emit("mark_seen", { room: chat.room });
      clearRoomUnread(chat.room);
    }

    if (notification.type === "dm_message") {
      handleMessageUser(chat);
    } else {
      setActiveSection("rooms");
      handleChatSelect(chat);
    }
  }

  function handleOpenProfile(chat) {
    if (
      chat?.recipientId == null ||
      String(chat.recipientId) === String(currentUserId)
    ) {
      return;
    }

    setActiveProfileChat(chat);
    setActiveSection("member_profile");
  }

  function handleShowMembers() {
    const socket = socketRef.current;
    const room = activeRoomRef.current;

    if (socket?.connected && room) {
      socket.emit("request_members", { room });
    }
    setActiveSection("members");
  }

  function handleFileSelect(file) {
    cancelVoiceRecording();
    setAttachmentError("");

    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      setSelectedFile(null);
      setAttachmentError("This file type is not supported.");
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      setSelectedFile(null);
      setAttachmentError("Files must be 10 MB or smaller.");
      return;
    }

    setSelectedFile(file);
  }

  function handleFileRemove() {
    if (sendInFlightRef.current) return;
    setSelectedFile(null);
    setAttachmentError("");
  }

  function handleStartEditingMessage(message) {
    if (!canEditMessage(message)) return;
    cancelVoiceRecording();
    setReplyingTo(null);
    setSelectedFile(null);
    setAttachmentError("");
    setEditingMessage(message);
    setMessageValue(message.text);
  }

  function handleCancelEditingMessage() {
    setEditingMessage(null);
    setMessageValue("");
    setAttachmentError("");
  }

  function handleStartReplyingToMessage(message) {
    if (!message?.backendId) return;
    cancelVoiceRecording();
    if (editingMessage) setMessageValue("");
    setEditingMessage(null);
    setReplyingTo(message);
    setAttachmentError("");
  }

  function handleCancelReply() {
    setReplyingTo(null);
    setAttachmentError("");
  }

  function handleReactToMessage(message, emoji, action = "set") {
    const socket = socketRef.current;
    if (!socket?.connected || !message?.backendId || !message.room) {
      setAttachmentError("Unable to react while disconnected.");
      return;
    }

    setAttachmentError("");
    socket.emit("toggle_message_reaction", {
      room: message.room,
      messageId: message.backendId,
      emoji,
      action,
    });
  }

  function handleDeleteMessageForMe(message) {
    if (message?.direction !== "outgoing" || !message.backendId) return;
    const nextHiddenIds = new Set(hiddenMessageIdsRef.current);
    nextHiddenIds.add(String(message.backendId));
    hiddenMessageIdsRef.current = nextHiddenIds;
    saveHiddenMessageIds(currentUserId, nextHiddenIds);
    if (editingMessage?.backendId === message.backendId) {
      handleCancelEditingMessage();
    }
    removeMessageFromUi(String(message.backendId), message.room);
  }

  async function handleDeleteMessageForEveryone(message) {
    if (message?.direction !== "outgoing" || !message.backendId) return;
    setAttachmentError("");
    try {
      await deleteMessageRequest(message.backendId);
      if (editingMessage?.backendId === message.backendId) {
        handleCancelEditingMessage();
      }
      removeMessageFromUi(String(message.backendId), message.room);
    } catch (error) {
      setAttachmentError(
        error.response?.data?.error ?? error.message ?? "Unable to delete message.",
      );
    }
  }

  async function handleMessageSend(value, options = {}) {
    const text = value?.trim();
    const socket = socketRef.current;
    const file = options.file ?? selectedFile;
    const voice = options.voice === true;

    if ((!text && !file) || sendInFlightRef.current) return;

    if (editingMessage) {
      if (!text) return;
      sendInFlightRef.current = true;
      setSendingMessage(true);
      setAttachmentError("");
      try {
        const updated = await editMessageRequest(editingMessage.backendId, text);
        const normalized = normalizeSocketMessage(updated, currentUserId);
        setChatMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === editingMessage.id
              ? { ...message, ...normalized }
              : message,
          ),
        );
        if (normalized) updateRoomLatestMessage(normalized);
        setEditingMessage(null);
        setMessageValue("");
      } catch (error) {
        setAttachmentError(
          error.response?.data?.error ?? error.message ?? "Unable to edit message.",
        );
      } finally {
        sendInFlightRef.current = false;
        setSendingMessage(false);
      }
      return;
    }

    if (!socket?.connected) {
      if (voice) cancelVoiceRecording();
      setAttachmentError("Unable to send while disconnected.");
      return;
    }

    stopTyping();
    sendInFlightRef.current = true;
    setSendingMessage(true);
    setAttachmentError("");

    const room = activeRoomRef.current;

    try {
      let attachment;

      if (file) {
        const uploadedFile = await uploadFile(file);

        if (!uploadedFile?.url) {
          throw new Error("Upload response did not include a file URL.");
        }

        attachment = {
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.originalName,
          mimeType: uploadedFile.mimeType,
        };
      }

      if (!socket.connected || activeRoomRef.current !== room) {
        throw new Error("The active room changed before the message was sent.");
      }

      const recipientId = activeDmRecipientIdRef.current;
      const replyToMessageId = replyingTo?.backendId;
      const payload = recipientId
        ? {
            recipientId,
            ...(text ? { message: text } : {}),
            ...(attachment ? { attachment } : {}),
            ...(replyToMessageId ? { replyToMessageId } : {}),
          }
        : {
            room,
            ...(text ? { message: text } : {}),
            ...(attachment ? { attachment } : {}),
            ...(replyToMessageId ? { replyToMessageId } : {}),
          };
      const eventName = recipientId ? "send_private_message" : "send_message";

      console.info("[socket] send", { event: eventName, payload });
      socket.emit(eventName, payload);
      setMessageValue("");
      setSelectedFile(null);
      setReplyingTo(null);
      if (voice) cancelVoiceRecording();
    } catch (error) {
      if (voice) cancelVoiceRecording();
      setAttachmentError(
        error.response?.data?.message ??
          error.message ??
          "Unable to send the attachment.",
      );
    } finally {
      if (voice) voiceSendPendingRef.current = false;
      sendInFlightRef.current = false;
      setSendingMessage(false);
    }
  }

  return (
    <main className="h-screen min-h-[640px] overflow-hidden bg-[#F7F7F5] font-sans text-[#202226] dark:bg-[#111315] dark:text-[#F4F5F6]">
      <div className="grid h-full grid-cols-[76px_minmax(0,1fr)] md:grid-cols-[76px_300px_minmax(0,1fr)] xl:grid-cols-[76px_390px_minmax(0,1fr)] 2xl:grid-cols-[76px_420px_minmax(0,1fr)]">
        <NavigationRail
          activeSection={activeSection}
          incomingFriendCount={incomingFriendCount}
          unreadNotificationCount={unreadNotificationCount}
          profileInitials={profileInitials}
          profileImage={resolveUploadedFileUrl(user?.profileImage)}
          loggingOut={loggingOut}
          onSectionChange={handleSectionChange}
          onLogout={handleLogout}
        />
        {activeSection === "friends" ? (
          <FriendsPage
            onlineUserKeys={onlineUserKeys}
            refreshVersion={friendsRefreshVersion}
            initialTab={friendsInitialTab}
            onIncomingCountChange={setIncomingFriendCount}
            onMessage={handleMessageUser}
          />
        ) : activeSection === "notifications" ? (
          <NotificationsPage
            notifications={notifications}
            onOpen={handleOpenNotification}
          />
        ) : activeSection === "profile" ? (
          <ProfilePage
            user={user}
            online={socketConnected}
            onProfileUpdated={updateAuthenticatedUser}
          />
        ) : activeSection === "settings" ? (
          <SettingsPage
            preferences={notificationPreferences}
            onPreferenceChange={handleNotificationPreferenceChange}
            loggingOut={loggingOut}
            onLogout={handleLogout}
          />
        ) : (
          <>
            <ChatList
              title={listTitle}
              chatItems={visibleChats}
              emptyMessage={listEmptyMessage}
              peopleMode={peopleMode}
              activeRoom={activeRoom}
              activeRoomOnline={activeChatOnline}
              onlineUserKeys={onlineUserKeys}
              roomSummaries={roomSummaries}
              pinnedConversations={pinnedConversations}
              mutedConversations={mutedConversations}
              relativeTimeNow={relativeTimeNow}
              onSelectChat={handleChatSelect}
              onTogglePin={handleToggleConversationPin}
              onRequestMute={handleRequestMuteConversation}
              onRequestDelete={handleRequestDeleteConversation}
              onOpenProfile={handleOpenProfile}
              onMessageUser={handleMessageUser}
            />
            <ConversationPanel
              activeChat={activeChat}
              activeChatOnline={activeChatOnline}
              isTyping={typingSocketIds.size > 0}
              messages={chatMessages}
              messagesEndRef={messagesEndRef}
              scrollContainerRef={messagesScrollRef}
              onMessagesScroll={handleMessagesScroll}
              loadingOlderMessages={loadingOlderMessages}
              messageValue={messageValue}
              onMessageChange={handleMessageChange}
              onMessageSend={handleMessageSend}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onFileRemove={handleFileRemove}
              recordingState={recordingState}
              recordingDuration={recordingDuration}
              onStartRecording={handleStartVoiceRecording}
              onStopRecording={handleStopVoiceRecording}
              onCancelRecording={handleCancelVoiceRecording}
              onShowMembers={handleShowMembers}
              composerLoading={sendingMessage}
              composerError={attachmentError}
              currentUserId={currentUserId}
              onReactMessage={handleReactToMessage}
              onOpenReactionDetails={(message) =>
                setReactionDetailsMessageId(message.id)
              }
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
              onReplyMessage={handleStartReplyingToMessage}
              editingMessage={editingMessage}
              onCancelEdit={handleCancelEditingMessage}
              onEditMessage={handleStartEditingMessage}
              onDeleteMessageForMe={handleDeleteMessageForMe}
              onDeleteMessageForEveryone={handleDeleteMessageForEveryone}
            />
          </>
        )}
      </div>
      {reactionDetailsMessage && (
        <ReactionDetailsModal
          message={reactionDetailsMessage}
          currentUserId={currentUserId}
          onClose={() => setReactionDetailsMessageId(null)}
          onRemove={(emoji) =>
            handleReactToMessage(reactionDetailsMessage, emoji, "remove")
          }
        />
      )}
      {deleteConfirmation && (
        <DeleteConversationModal
          conversation={deleteConfirmation}
          deleting={deletingConversation}
          error={deleteConversationError}
          onClose={() => {
            if (deletingConversation) return;
            setDeleteConfirmation(null);
            setDeleteConversationError("");
          }}
          onConfirm={handleConfirmDeleteConversation}
        />
      )}
      {muteConfirmation && (
        <MuteConversationModal
          conversation={muteConfirmation}
          onClose={() => setMuteConfirmation(null)}
          onSelect={handleMuteDuration}
        />
      )}
    </main>
  );
}
