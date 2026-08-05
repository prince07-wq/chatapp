import { useEffect, useRef, useState } from "react";
import { EllipsisVertical, PenLine, Plus, Search, SlidersHorizontal } from "lucide-react";

import ChatListItem from "../../../components/Chat/ChatListItem.jsx";
import UserListItem from "../../../components/Chat/UserListItem.jsx";
import ThemeToggle from "../../../components/UI/ThemeToggle.jsx";
import { searchChat as searchChatRequest } from "../../../api/userApi.js";
import { getConversationActivityTime, getRoomPreview, isConversationMuted } from "../utils/conversation.js";
import ConversationContextMenu from "./ConversationContextMenu.jsx";

const EMPTY_ROOM_SUMMARIES = Object.freeze({});

function getUserInitials(username) {
  return String(username || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function presenceNameKey(username) {
  return username ? `name:${username.trim().toLowerCase()}` : null;
}

function IconButton({ label, children, className = "", ...props }) {
  return (
    <button type="button" aria-label={label} title={label} className={[
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
      "text-[#6F737B] transition-colors duration-200",
      "hover:bg-black/[0.045] hover:text-[#202226]",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35",
      "dark:text-[#9CA2AC] dark:hover:bg-white/[0.07] dark:hover:text-white",
      className,
    ].join(" ")} {...props}>{children}</button>
  );
}

export default function ChatSidebar({
  title = "Chats",
  chatItems = [],
  emptyMessage,
  peopleMode = false,
  activeRoom,
  activeRoomOnline,
  onlineUserKeys,
  roomSummaries = EMPTY_ROOM_SUMMARIES,
  pinnedConversations = [],
  mutedConversations = [],
  archivedConversations = [],
  relativeTimeNow,
  onSelectChat,
  onTogglePin,
  onRequestMute,
  onToggleArchive,
  onRequestDelete,
  onOpenProfile,
  onMessageUser,
  onOpenSearchConversation,
  onOpenSearchUser,
  onOpenSearchMessage,
  mobileVisible = false,
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchLoadingMore, setSearchLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [conversationMenu, setConversationMenu] = useState(null);
  const searchControllerRef = useRef(null);
  const searchRequestIdRef = useRef(0);
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

  useEffect(() => {
    const query = searchQuery.trim();
    const requestId = ++searchRequestIdRef.current;
    searchControllerRef.current?.abort();

    if (!query) return undefined;

    const timeoutId = window.setTimeout(async () => {
      const controller = new AbortController();
      searchControllerRef.current = controller;
      try {
        const results = await searchChatRequest(query, { signal: controller.signal });
        if (requestId === searchRequestIdRef.current) {
          setSearchResults(results);
        }
      } catch (error) {
        if (error.code !== "ERR_CANCELED" && requestId === searchRequestIdRef.current) {
          setSearchError(error.response?.data?.error ?? error.message ?? "Search failed.");
        }
      } finally {
        if (requestId === searchRequestIdRef.current) setSearchLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
      searchControllerRef.current?.abort();
    };
  }, [searchQuery]);

  function handleSearchQueryChange(event) {
    const nextQuery = event.target.value;
    setSearchQuery(nextQuery);
    if (nextQuery.trim()) {
      setSearchResults(null);
      setSearchError("");
      setSearchLoading(true);
      return;
    }

    searchControllerRef.current?.abort();
    setSearchResults(null);
    setSearchLoading(false);
    setSearchLoadingMore(false);
    setSearchError("");
  }

  async function loadMoreMessageResults() {
    const query = searchQuery.trim();
    const nextPage = Number(searchResults?.messagePage?.page || 0) + 1;
    if (!query || searchLoadingMore || !searchResults?.messagePage?.hasMore) return;

    const requestId = ++searchRequestIdRef.current;
    searchControllerRef.current?.abort();
    const controller = new AbortController();
    searchControllerRef.current = controller;
    setSearchLoadingMore(true);
    try {
      const nextResults = await searchChatRequest(query, {
        page: nextPage,
        signal: controller.signal,
      });
      if (requestId === searchRequestIdRef.current) {
        setSearchResults((current) => ({
          ...nextResults,
          messages: [
            ...(current?.messages || []),
            ...(nextResults.messages || []).filter(
              (message) =>
                !(current?.messages || []).some(
                  (currentMessage) => String(currentMessage._id) === String(message._id),
                ),
            ),
          ],
        }));
      }
    } catch (error) {
      if (error.code !== "ERR_CANCELED" && requestId === searchRequestIdRef.current) {
        setSearchError(error.response?.data?.error ?? error.message ?? "Search failed.");
      }
    } finally {
      if (requestId === searchRequestIdRef.current) setSearchLoadingMore(false);
    }
  }

  function openConversationMenu(chat, event) {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === "click" && conversationMenu?.room === chat.room) {
      setConversationMenu(null);
      return;
    }

    const menuWidth = 176;
    const menuHeight = 184;
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
  const archivedByRoom = new Set(
    archivedConversations.map((conversation) => conversation.room),
  );
  const originalChatIndexes = new Map(
    chatItems.map((chat, index) => [chat.room, index]),
  );
  const filteredChatItems = chatItems
    .filter((chat) => {
      const roomSummary = getChatSummary(chat);
      const archived = archivedByRoom.has(chat.room);
      const matchesFilter =
        (activeFilter === "archived" && archived) ||
        (activeFilter === "all" && !archived) ||
        (activeFilter === "unread" && Number(roomSummary.unreadCount) > 0) ||
        (activeFilter === "groups" && chat.group);

      if (activeFilter !== "archived" && archived) return false;

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
    <section className={`${mobileVisible ? "flex" : "hidden"} min-h-0 min-w-0 flex-col border-r border-[#ECEDEA] bg-white dark:border-white/[0.06] dark:bg-[#181A1F] md:flex`}>
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
            onChange={handleSearchQueryChange}
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
            aria-pressed={activeFilter === "archived"}
            onClick={() => setActiveFilter("archived")}
            className={`h-9 rounded-xl px-3.5 text-[13px] font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 ${activeFilter === "archived" ? activeChipColors : inactiveChipColors}`}
          >
            Archived
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
        {normalizedSearchQuery ? (
          <div className="py-2">
            {searchLoading && (
              <p className="px-3 py-4 text-center text-[13px] text-[#92969D] dark:text-[#777E88]">
                Searching conversations...
              </p>
            )}
            {searchError && (
              <p className="px-3 py-4 text-center text-[13px] text-[#B65A5A]">
                {searchError}
              </p>
            )}
            {!searchLoading && !searchError && searchResults && (
              <>
                {[
                  ["Rooms", searchResults.rooms, onOpenSearchConversation],
                  ["Direct messages", searchResults.dms, onOpenSearchConversation],
                  ["People", searchResults.users, onOpenSearchUser],
                ].map(([label, results, onOpen]) =>
                  results?.length ? (
                    <section key={label} className="mb-3">
                      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#92969D] dark:text-[#777E88]">
                        {label}
                      </p>
                      {results.map((result) => (
                        <button
                          key={`${label}-${result.room ?? result.userId}`}
                          type="button"
                          onClick={() => onOpen(result)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:hover:bg-white/[0.06]"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E4ECF7] text-[12px] font-semibold text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]">
                            {getUserInitials(result.name)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[14px] font-medium text-[#303238] dark:text-[#E8EAF0]">
                              {result.type === "room"
                                ? "Room"
                                : result.name || result.username}
                            </span>
                            <span className="block truncate text-[12px] text-[#92969D] dark:text-[#777E88]">
                              {result.relationshipStatus ||
                                (result.type === "dm"
                                  ? "Direct message"
                                  : result.type === "room"
                                    ? "Room"
                                    : "User")}
                            </span>
                          </span>
                        </button>
                      ))}
                    </section>
                  ) : null,
                )}
                {searchResults.messages?.length > 0 && (
                  <section className="mb-3">
                    <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#92969D] dark:text-[#777E88]">
                      Messages
                    </p>
                    {searchResults.messages.map((message) => (
                      <button
                        key={message._id}
                        type="button"
                        onClick={() => onOpenSearchMessage(message)}
                        className="block w-full rounded-xl px-3 py-2.5 text-left hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:hover:bg-white/[0.06]"
                      >
                        <span className="block truncate text-[13px] font-medium text-[#303238] dark:text-[#E8EAF0]">
                          {message.conversation?.type === "dm"
                            ? message.conversation.name
                            : "Room"}
                        </span>
                        <span className="block truncate text-[12px] text-[#777C84] dark:text-[#AEB3BB]">
                          {message.message || message.attachment?.fileName || "Attachment"}
                        </span>
                      </button>
                    ))}
                    {searchResults.messagePage?.hasMore && (
                      <button
                        type="button"
                        onClick={loadMoreMessageResults}
                        disabled={searchLoadingMore}
                        className="mx-3 mt-1 rounded-lg px-2 py-1.5 text-[12px] font-medium text-[#3B82F6] hover:bg-[#F4F4F2] disabled:opacity-60 dark:hover:bg-white/[0.06]"
                      >
                        {searchLoadingMore ? "Loading..." : "Load more messages"}
                      </button>
                    )}
                  </section>
                )}
                {!searchResults.rooms?.length &&
                  !searchResults.dms?.length &&
                  !searchResults.users?.length &&
                  !searchResults.messages?.length && (
                    <p className="px-3 py-8 text-center text-[13px] text-[#92969D] dark:text-[#777E88]">
                      No results found.
                    </p>
                  )}
              </>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}
        {!normalizedSearchQuery && conversationMenu && (
          <ConversationContextMenu
            menu={conversationMenu}
            chatItems={chatItems}
            pinned={pinnedByRoom.has(conversationMenu.room)}
            muted={isMuted(conversationMenu.room)}
            archived={archivedByRoom.has(conversationMenu.room)}
            onClose={() => setConversationMenu(null)}
            onTogglePin={onTogglePin}
            onRequestMute={onRequestMute}
            onToggleArchive={onToggleArchive}
            onRequestDelete={onRequestDelete}
          />
        )}
        {!normalizedSearchQuery && filteredChatItems.length === 0 && filteredEmptyMessage && (
          <p className="px-3 py-8 text-center text-[13px] text-[#92969D] dark:text-[#777E88]">
            {filteredEmptyMessage}
          </p>
        )}
      </div>
    </section>
  );
}
