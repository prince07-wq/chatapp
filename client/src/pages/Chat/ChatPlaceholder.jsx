import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  Bell,
  EllipsisVertical,
  House,
  LogOut,
  MessageCircle,
  MessageSquare,
  PenLine,
  Phone,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
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
import NavigationItem from "../../components/Chat/NavigationItem.jsx";
import UserListItem from "../../components/Chat/UserListItem.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  getLatestPrivateMessagePage,
  getLatestRoomMessagePage,
  getPrivateMessagePage,
  getRoomMessagePage,
} from "../../api/messageApi.js";
import { getOnlineUsers } from "../../api/userApi.js";
import { getAccessToken } from "../../utils/tokenStorage.js";
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
  { label: "Notifications", icon: Bell, badge: 3 },
  { label: "Profile", icon: User },
  { label: "Settings", icon: Settings },
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
    text,
    attachment,
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
    room: message.room ?? incomingMessage?.room,
  };
}

const MESSAGE_STATUS_RANK = { sent: 1, delivered: 2, seen: 3 };

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
  profileInitials,
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
            badge={item.badge}
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
  relativeTimeNow,
  onSelectChat,
  onOpenProfile,
  onMessageUser,
}) {
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
            className="h-9 rounded-xl bg-[#3B82F6] px-4 text-[13px] font-medium text-white transition-colors duration-200 hover:bg-[#3478E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35"
          >
            All
          </button>
          <button
            type="button"
            className="h-9 rounded-xl border border-[#E5E6E3] px-3.5 text-[13px] font-medium text-[#646970] transition-colors duration-200 hover:border-[#D8DAD6] hover:bg-[#F7F7F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:border-white/[0.08] dark:text-[#AEB3BB] dark:hover:bg-[#20242B]"
          >
            Unread <span className="ml-1 text-[#3B82F6]">5</span>
          </button>
          <button
            type="button"
            className="hidden h-9 rounded-xl border border-[#E5E6E3] px-3.5 text-[13px] font-medium text-[#646970] transition-colors duration-200 hover:border-[#D8DAD6] hover:bg-[#F7F7F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:border-white/[0.08] dark:text-[#AEB3BB] dark:hover:bg-[#20242B] xl:block"
          >
            Groups <span className="ml-1 text-[#8C9198]">3</span>
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
        {chatItems.map((chat) => {
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

          const roomSummary = roomSummaries?.[chat.room] ?? {
            unreadCount: Math.max(0, chat.unread ?? 0),
            latestMessage: null,
          };
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
              onClick={() => onSelectChat(chat)}
            />
          );
        })}
        {chatItems.length === 0 && emptyMessage && (
          <p className="px-3 py-8 text-center text-[13px] text-[#92969D] dark:text-[#777E88]">
            {emptyMessage}
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
}) {
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
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              messageId={message.id}
              text={message.text}
              attachment={message.attachment}
              senderType={
                message.direction === "outgoing" ? "sent" : "received"
              }
              timestamp={message.time}
              deliveryStatus={
                message.direction === "outgoing"
                  ? message.status ?? (message.read ? "seen" : undefined)
                  : undefined
              }
              breakBefore={message.breakBefore}
            />
          ))}
          {isTyping && (
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
          )}
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
}) {
  return (
    <section className="relative col-start-2 flex min-h-0 min-w-0 flex-col bg-[#F7F7F5] dark:bg-[#111315] md:col-start-auto">
      <ConversationHeader
        avatar={{
          initials: activeChat.initials,
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
        placeholder="Type a message..."
      />
    </section>
  );
}

export default function ChatPlaceholder() {
  const { user, logout } = useAuth();
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

  const profileName = user?.username || user?.email || "You";
  const profileInitials = profileName.slice(0, 2).toUpperCase();
  const currentUserId = user?._id ?? user?.id;
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
      preview: "Start a conversation",
      time: "",
      tone:
        "bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]",
    }))
    .filter((chat) => chat.room);
  const dmChats = userChats.filter((chat) =>
    dmConversationUserIds.has(chat.recipientId),
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
      preview: "Message",
      time: "",
      tone:
        "bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]",
    }))
    .filter((chat) => chat.room);
  const allChats = [...chats, ...dmChats];
  const visibleChats =
    activeSection === "dms"
      ? dmChats
      : activeSection === "friends"
        ? userChats
        : activeSection === "members"
          ? roomMemberChats
          : activeSection === "profile" && activeProfileChat
            ? [activeProfileChat]
            : chats;
  const peopleMode = ["friends", "members", "profile"].includes(
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
          : activeSection === "profile"
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
  const activeChat =
    allChats.find((chat) => chat.room === activeRoom) ?? chats[0];
  const activeChatOnline =
    activeRoomMemberSocketIds.size > 0 ||
    (activeChat.recipientId
      ? onlineUserKeys.has(`id:${activeChat.recipientId}`)
      : onlineUserKeys.has(presenceNameKey(activeChat.name)));

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
                },
              ]),
          ).values(),
        );

        setAvailableDmUsers(uniqueUsers);
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
    }

    function handleReceiveMessage(incomingMessage) {
      const message = normalizeSocketMessage(incomingMessage, currentUserId);

      if (!message || receivedSocketMessageIdsRef.current.has(message.id)) {
        return;
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

    function handleUserJoined({ room, socketId, userId, username } = {}) {
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
                { socketId, userId: String(userId), username },
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

    function handleUserOnline({ userId, username } = {}) {
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
              { userId: normalizedUserId, username: username || "User" },
            ];
          }

          if (!username || currentUsers[existingIndex].username === username) {
            return currentUsers;
          }

          return currentUsers.map((availableUser, index) =>
            index === existingIndex
              ? { ...availableUser, username }
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

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("socket_error", handleSocketError);
    socket.on("error", handleSocketError);
    socket.on("new_message", handleReceiveMessage);
    socket.on("message_status_update", handleMessageStatusUpdate);
    socket.on("typing_start", handleTypingStart);
    socket.on("typing_stop", handleTypingStop);
    socket.on("room_joined", handleRoomJoined);
    socket.on("room_members", handleRoomMembers);
    socket.on("user_joined", handleUserJoined);
    socket.on("user_left", handleUserLeft);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);

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
      socket.off("message_status_update", handleMessageStatusUpdate);
      socket.off("typing_start", handleTypingStart);
      socket.off("typing_stop", handleTypingStop);
      socket.off("room_joined", handleRoomJoined);
      socket.off("room_members", handleRoomMembers);
      socket.off("user_joined", handleUserJoined);
      socket.off("user_left", handleUserLeft);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.disconnect();
      socketRef.current = null;
      joinedRoomRef.current = null;
    };
  }, [currentUserId]);

  useEffect(() => {
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
              message && String(message.room) === String(activeRoom),
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

    if (shouldAutoScrollNewMessageRef.current) {
      shouldAutoScrollNewMessageRef.current = false;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

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
            }
          : message;

      return {
        ...currentSummaries,
        [message.room]: { ...roomSummary, latestMessage },
      };
    });
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
          (message) => message && String(message.room) === String(room),
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
    cancelVoiceRecording();
    setSelectedFile(null);
    setAttachmentError("");
  }

  function handleSectionChange(section) {
    if (["rooms", "dms", "friends"].includes(section)) {
      setActiveSection(section);
    }
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
    handleChatSelect({ ...chat, recipientId: normalizedRecipientId });
  }

  function handleOpenProfile(chat) {
    if (
      chat?.recipientId == null ||
      String(chat.recipientId) === String(currentUserId)
    ) {
      return;
    }

    setActiveProfileChat(chat);
    setActiveSection("profile");
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

  async function handleMessageSend(value, options = {}) {
    const text = value?.trim();
    const socket = socketRef.current;
    const file = options.file ?? selectedFile;
    const voice = options.voice === true;

    if ((!text && !file) || sendInFlightRef.current) return;

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
      const payload = recipientId
        ? {
            recipientId,
            ...(text ? { message: text } : {}),
            ...(attachment ? { attachment } : {}),
          }
        : {
            room,
            ...(text ? { message: text } : {}),
            ...(attachment ? { attachment } : {}),
          };
      const eventName = recipientId ? "send_private_message" : "send_message";

      console.info("[socket] send", { event: eventName, payload });
      socket.emit(eventName, payload);
      setMessageValue("");
      setSelectedFile(null);
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
          profileInitials={profileInitials}
          loggingOut={loggingOut}
          onSectionChange={handleSectionChange}
          onLogout={handleLogout}
        />
        <ChatList
          title={listTitle}
          chatItems={visibleChats}
          emptyMessage={listEmptyMessage}
          peopleMode={peopleMode}
          activeRoom={activeRoom}
          activeRoomOnline={activeChatOnline}
          onlineUserKeys={onlineUserKeys}
          roomSummaries={roomSummaries}
          relativeTimeNow={relativeTimeNow}
          onSelectChat={handleChatSelect}
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
        />
      </div>
    </main>
  );
}
