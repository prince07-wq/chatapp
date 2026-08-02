import { useEffect, useRef, useState } from "react";
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
import { useAuth } from "../../context/AuthContext.jsx";
import { getAccessToken } from "../../utils/tokenStorage.js";

const PLACEHOLDER_ROOM = "test-room";

const navigationItems = [
  { label: "Rooms", icon: House, active: true },
  { label: "DMs", icon: MessageCircle },
  { label: "Friends", icon: UserPlus },
  { label: "Calls", icon: Phone },
  { label: "Notifications", icon: Bell, badge: 3 },
  { label: "Profile", icon: User },
  { label: "Settings", icon: Settings },
];

const chats = [
  {
    id: 1,
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

  if (!text) return null;

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
    message.timestamp ??
    incomingMessage?.createdAt ??
    incomingMessage?.timestamp;
  const messageId =
    message._id ??
    message.id ??
    incomingMessage?._id ??
    incomingMessage?.id ??
    message.clientMessageId ??
    `${incomingMessage?.room ?? "unknown-room"}-${senderId ?? "unknown"}-${createdAt ?? text}`;

  return {
    id: `socket-${messageId}`,
    text,
    time: message.time ?? formatMessageTime(createdAt),
    direction:
      senderId != null && String(senderId) === String(currentUserId)
        ? "outgoing"
        : "incoming",
    read:
      message.read === true ||
      message.status === "read" ||
      message.deliveryStatus === "read",
    room: message.room ?? incomingMessage?.room,
  };
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

function NavigationRail({ profileInitials, loggingOut, onLogout }) {
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
    active={item.active}
    badge={item.badge}
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

function ChatList() {
  return (
    <section className="hidden min-h-0 min-w-0 flex-col border-r border-[#ECEDEA] bg-white dark:border-white/[0.06] dark:bg-[#181A1F] md:flex">
      <header className="shrink-0 px-5 pb-4 pt-5 xl:px-6">
        <div className="flex h-10 items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9EA5]">
              Workspace
            </p>
            <h1 className="mt-0.5 text-[24px] font-semibold tracking-[-0.035em] text-[#1C1E22] dark:text-[#F3F4F6]">
              Chats
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
        {chats.map((chat) => (
          <ChatListItem
            key={chat.id}
            avatar={{
              initials: chat.initials,
              tone: chat.tone,
              group: chat.group,
            }}
            name={chat.name}
            preview={chat.preview}
            time={chat.time}
            unreadCount={chat.unread}
            active={chat.active}
            online={chat.online}
            read={chat.read}
          />
        ))}
      </div>
    </section>
  );
}

function ConversationMessages({ messages, messagesEndRef }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F7F5] px-5 py-7 dark:bg-[#111315] sm:px-8 lg:px-10 xl:px-14">
      <div className="mx-auto flex min-h-full max-w-[1100px] flex-col">
        <div className="flex justify-center">
          <span className="rounded-full border border-black/[0.035] bg-white px-4 py-1.5 text-[11px] font-medium text-[#777C84] shadow-[0_2px_7px_rgba(20,22,26,0.025)] dark:border-white/[0.05] dark:bg-[#20242B] dark:text-[#AEB3BB]">
            Today
          </span>
        </div>

        <div className="mt-7 flex flex-1 flex-col justify-center pb-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              text={message.text}
              senderType={
                message.direction === "outgoing" ? "sent" : "received"
              }
              timestamp={message.time}
              deliveryStatus={message.read ? "read" : undefined}
              breakBefore={message.breakBefore}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}

function ConversationPanel({
  messages,
  messagesEndRef,
  messageValue,
  onMessageChange,
  onMessageSend,
}) {
  return (
    <section className="col-start-2 flex min-h-0 min-w-0 flex-col bg-[#F7F7F5] dark:bg-[#111315] md:col-start-auto">
      <ConversationHeader
        avatar={{
          initials: "AM",
          tone:
            "bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]",
        }}
        name="Aiden Morgan"
        statusText="Online"
        online
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
            <IconButton label="Conversation options">
              <EllipsisVertical size={20} strokeWidth={1.8} />
            </IconButton>
          </>
        }
      />
      <ConversationMessages
        messages={messages}
        messagesEndRef={messagesEndRef}
      />
      <MessageComposer
        value={messageValue}
        onChange={onMessageChange}
        onSend={onMessageSend}
        placeholder="Type a message..."
      />
    </section>
  );
}

export default function ChatPlaceholder() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [chatMessages, setChatMessages] = useState(messages);
  const [messageValue, setMessageValue] = useState("");
  const messagesEndRef = useRef(null);
  const previousMessageCountRef = useRef(messages.length);
  const socketRef = useRef(null);

  const profileName = user?.username || user?.email || "You";
  const profileInitials = profileName.slice(0, 2).toUpperCase();
  const currentUserId = user?._id ?? user?.id;

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
      const payload = { room: PLACEHOLDER_ROOM };
      console.info("[socket] connect", socket.id);
      console.info("[socket] join", payload);
      socket.emit("join_room", payload);
    }

    function handleDisconnect(reason) {
      console.info("[socket] disconnect", reason);
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

      if (!message || String(message.room) !== PLACEHOLDER_ROOM) {
        return;
      }

      console.info("[socket] receive", {
        room: message.room,
        id: message.id,
      });

      setChatMessages((currentMessages) =>
        currentMessages.some((currentMessage) => currentMessage.id === message.id)
          ? currentMessages
          : [...currentMessages, message],
      );
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("socket_error", handleSocketError);
    socket.on("error", handleSocketError);
    socket.on("new_message", handleReceiveMessage);

    return () => {
      if (socket.connected) {
        socket.emit("leave_room", { room: PLACEHOLDER_ROOM });
      }
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("socket_error", handleSocketError);
      socket.off("error", handleSocketError);
      socket.off("new_message", handleReceiveMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (chatMessages.length > previousMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    previousMessageCountRef.current = chatMessages.length;
  }, [chatMessages.length]);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  function handleMessageSend(value) {
    const text = value?.trim();
    const socket = socketRef.current;

    if (!text || !socket?.connected) return;

    const payload = { room: PLACEHOLDER_ROOM, message: text };
    console.info("[socket] send", payload);
    socket.emit(
      "send_message",
      payload,
      (response) => {
        if (response?.error) {
          console.error("[socket] send_error", response.error);
          setMessageValue((currentValue) => currentValue || text);
        }
      },
    );
    setMessageValue("");
  }

  return (
    <main className="h-screen min-h-[640px] overflow-hidden bg-[#F7F7F5] font-sans text-[#202226] dark:bg-[#111315] dark:text-[#F4F5F6]">
      <div className="grid h-full grid-cols-[76px_minmax(0,1fr)] md:grid-cols-[76px_300px_minmax(0,1fr)] xl:grid-cols-[76px_390px_minmax(0,1fr)] 2xl:grid-cols-[76px_420px_minmax(0,1fr)]">
        <NavigationRail
          profileInitials={profileInitials}
          loggingOut={loggingOut}
          onLogout={handleLogout}
        />
        <ChatList />
        <ConversationPanel
          messages={chatMessages}
          messagesEndRef={messagesEndRef}
          messageValue={messageValue}
          onMessageChange={(event) => setMessageValue(event.target.value)}
          onMessageSend={handleMessageSend}
        />
      </div>
    </main>
  );
}
