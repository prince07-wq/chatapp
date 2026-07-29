import { useState } from "react";
import {
  Bell,
  CheckCheck,
  EllipsisVertical,
  House,
  LogOut,
  MessageCircle,
  MessageSquare,
  Mic,
  Paperclip,
  PenLine,
  Phone,
  Plus,
  Search,
  Send,
  Settings,
  SlidersHorizontal,
  Smile,
  User,
  UserPlus,
  Users,
  Video,
} from "lucide-react";

import ThemeToggle from "../../components/UI/ThemeToggle.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

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

function Avatar({
  initials,
  tone,
  size = 48,
  online = false,
  group = false,
}) {
  return (
    <div className="relative shrink-0">
      <div
        className={`flex items-center justify-center rounded-full ${tone}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {group ? (
          <Users size={size * 0.42} strokeWidth={1.8} />
        ) : (
          <span
            className="font-semibold tracking-[-0.02em]"
            style={{ fontSize: size * 0.28 }}
          >
            {initials}
          </span>
        )}
      </div>

      {online && (
        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-[3px] border-white bg-[#7D838C] dark:border-[#181A1F] dark:bg-[#A2A8B1]" />
      )}
    </div>
  );
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

function NavigationRailItem({ item }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      aria-label={item.label}
      aria-current={item.active ? "page" : undefined}
      title={item.label}
      className="group flex w-full shrink-0 flex-col items-center gap-1.5 text-center focus:outline-none"
    >
      <span
        className={[
          "relative flex h-[50px] w-[50px] items-center justify-center rounded-[15px]",
          "transition-colors duration-200 group-focus-visible:ring-2 group-focus-visible:ring-[#3B82F6]/50",
          item.active
            ? "bg-[#3B82F6] text-white"
            : "text-[#979DA6] group-hover:bg-white/[0.045] group-hover:text-[#C8CCD2]",
        ].join(" ")}
      >
        <Icon size={21} strokeWidth={item.active ? 2.1 : 1.8} />

        {item.badge && (
          <span className="absolute -right-1.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#17191D] bg-[#3A3F47] px-1 text-[9px] font-semibold text-[#E5E7EA] dark:border-[#181A1F]">
            {item.badge}
          </span>
        )}
      </span>

      <span
        className={[
          "text-[10px] font-medium leading-none transition-colors duration-200",
          item.active
            ? "text-[#DDE1E6]"
            : "text-[#7F858F] group-hover:text-[#A8ADB5]",
        ].join(" ")}
      >
        {item.label}
      </span>
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
          <NavigationRailItem key={item.label} item={item} />
        ))}
      </nav>

      <div className="flex shrink-0 items-center justify-center gap-1 border-t border-white/[0.06] py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#25282E] text-xs font-semibold text-white">
          {profileInitials}
        </div>

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
          <button
            key={chat.id}
            type="button"
            className={[
              "mb-1 flex w-full items-center gap-3 rounded-[15px] px-3 py-3.5 text-left",
              "transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30",
              chat.active
                ? "bg-[#EEF4FD] ring-1 ring-inset ring-[#3B82F6]/10 dark:bg-[#3B82F6]/10 dark:ring-[#3B82F6]/15"
                : "hover:bg-[#F7F7F5] dark:hover:bg-[#20242B]",
            ].join(" ")}
          >
            <Avatar
              initials={chat.initials}
              tone={chat.tone}
              size={48}
              online={chat.online}
              group={chat.group}
            />

            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-[14px] font-semibold text-[#25272B] dark:text-[#F0F1F3] xl:text-[15px]">
                  {chat.name}
                </span>
                <span
                  className={[
                    "shrink-0 text-[11px]",
                    chat.unread
                      ? "font-medium text-[#6F747C] dark:text-[#A7ACB5]"
                      : "text-[#92969D]",
                  ].join(" ")}
                >
                  {chat.time}
                </span>
              </span>

              <span className="mt-1.5 flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1">
                  {chat.read && (
                    <CheckCheck
                      size={15}
                      strokeWidth={1.9}
                      className="shrink-0 text-[#3B82F6]"
                    />
                  )}
                  <span className="truncate text-[13px] text-[#777C84] dark:text-[#949AA4]">
                    {chat.preview}
                  </span>
                </span>

                {chat.unread && (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] px-1.5 text-[10px] font-semibold text-white">
                    {chat.unread}
                  </span>
                )}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ConversationHeader() {
  return (
    <header className="relative flex h-[92px] shrink-0 items-center border-b border-[#E8E9E6] bg-white px-4 dark:border-white/[0.06] dark:bg-[#181A1F] lg:px-6">
      <div className="hidden items-center lg:flex">
        <Avatar
          initials="AM"
          tone="bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]"
          size={54}
          online
        />
      </div>

      <div className="absolute left-1/2 top-1/2 max-w-[42%] -translate-x-1/2 -translate-y-1/2 text-center">
        <h2 className="truncate text-[20px] font-semibold tracking-[-0.025em] text-[#202226] dark:text-[#F4F5F6]">
          Aiden Morgan
        </h2>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-[12px] text-[#7B8087] dark:text-[#969CA6]">
          <span>Online</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#7D838C] dark:bg-[#A2A8B1]" />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-0.5">
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
      </div>
    </header>
  );
}

function ConversationMessages() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#F7F7F5] px-5 py-7 dark:bg-[#111315] sm:px-8 lg:px-10 xl:px-14">
      <div className="mx-auto flex min-h-full max-w-[1100px] flex-col">
        <div className="flex justify-center">
          <span className="rounded-full border border-black/[0.035] bg-white px-4 py-1.5 text-[11px] font-medium text-[#777C84] shadow-[0_2px_7px_rgba(20,22,26,0.025)] dark:border-white/[0.05] dark:bg-[#20242B] dark:text-[#AEB3BB]">
            Today
          </span>
        </div>

        <div className="mt-7 flex flex-1 flex-col justify-center pb-4">
          {messages.map((message) => {
            const outgoing = message.direction === "outgoing";

            return (
              <div
                key={message.id}
                className={[
                  "flex",
                  outgoing ? "justify-end" : "justify-start",
                  message.breakBefore ? "mt-7" : "mt-2",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex max-w-[82%] flex-col sm:max-w-[70%] lg:max-w-[62%]",
                    outgoing ? "items-end" : "items-start",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "rounded-[16px] px-4 py-2.5 text-[14px] leading-6 sm:text-[15px]",
                      "shadow-[0_2px_7px_rgba(20,22,26,0.025)]",
                      outgoing
                        ? "rounded-br-[6px] bg-[#3B82F6] text-white"
                        : "rounded-bl-[6px] border border-black/[0.035] bg-white text-[#25272B] dark:border-white/[0.05] dark:bg-[#20242B] dark:text-[#ECEEF1]",
                    ].join(" ")}
                  >
                    {message.text}
                  </div>

                  <span className="mt-1 flex items-center gap-1.5 px-1 text-[10px] text-[#969AA1] dark:text-[#737A84]">
                    {message.time}
                    {message.read && (
                      <CheckCheck
                        size={14}
                        strokeWidth={2}
                        className="text-[#3B82F6]"
                      />
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MessageComposer() {
  return (
    <footer className="shrink-0 border-t border-[#E8E9E6] bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-[#181A1F] lg:px-5">
      <div className="mx-auto flex max-w-[1180px] items-center gap-2.5">
        <IconButton label="Attach a file">
          <Paperclip size={20} strokeWidth={1.8} />
        </IconButton>
        <IconButton label="Choose an emoji" className="hidden sm:flex">
          <Smile size={20} strokeWidth={1.8} />
        </IconButton>

        <div className="flex h-12 min-w-0 flex-1 items-center rounded-[15px] border border-[#E7E8E5] bg-[#F7F7F5] px-4 transition-colors duration-200 focus-within:border-[#3B82F6]/35 focus-within:ring-2 focus-within:ring-[#3B82F6]/10 dark:border-white/[0.06] dark:bg-[#20242B]">
          <input
            type="text"
            aria-label="Message"
            placeholder="Type a message..."
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[#292B2F] outline-none placeholder:text-[#9A9EA5] dark:text-[#F1F2F4] dark:placeholder:text-[#777E88]"
          />
          <button
            type="button"
            aria-label="Record a voice message"
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-[10px] text-[#848991] transition-colors duration-200 hover:bg-black/[0.04] hover:text-[#3B82F6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:hover:bg-white/[0.06]"
          >
            <Mic size={18} strokeWidth={1.8} />
          </button>
        </div>

        <button
          type="button"
          aria-label="Send message"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#3B82F6] text-white shadow-[0_4px_12px_rgba(59,130,246,0.16)] transition-colors duration-200 hover:bg-[#3478E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#181A1F]"
        >
          <Send size={20} strokeWidth={1.9} />
        </button>
      </div>
    </footer>
  );
}

function ConversationPanel() {
  return (
    <section className="col-start-2 flex min-h-0 min-w-0 flex-col bg-[#F7F7F5] dark:bg-[#111315] md:col-start-auto">
      <ConversationHeader />
      <ConversationMessages />
      <MessageComposer />
    </section>
  );
}

export default function ChatPlaceholder() {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const profileName = user?.username || user?.email || "You";
  const profileInitials = profileName.slice(0, 2).toUpperCase();

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
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
        <ConversationPanel />
      </div>
    </main>
  );
}
