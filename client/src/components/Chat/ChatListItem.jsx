import { CheckCheck, EllipsisVertical, Pin } from "lucide-react";

import Avatar from "./Avatar.jsx";

function ChatListItem({
  avatar,
  name,
  preview,
  time,
  unreadCount,
  active = false,
  online = false,
  read = false,
  pinned = false,
  menuOpen = false,
  onClick,
  onMenuToggle,
}) {
  const normalizedUnreadCount = Number.isFinite(Number(unreadCount))
    ? Math.max(0, Math.floor(Number(unreadCount)))
    : 0;
  const hasUnread = normalizedUnreadCount > 0;

  return (
    <div
      onContextMenu={(event) => {
        event.preventDefault();
        onMenuToggle(event);
      }}
      className={[
        "group relative mb-1 flex w-full items-center rounded-[15px]",
        "transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30",
        active
          ? "bg-[#EEF4FD] ring-1 ring-inset ring-[#3B82F6]/10 dark:bg-[#3B82F6]/10 dark:ring-[#3B82F6]/15"
          : "hover:bg-[#F7F7F5] dark:hover:bg-[#20242B]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-[15px] px-3 py-3.5 pr-10 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30"
      >
        <Avatar {...avatar} size="md" online={online} />

        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[14px] font-semibold text-[#25272B] dark:text-[#F0F1F3] xl:text-[15px]">
                {name}
              </span>
              {pinned && (
                <Pin
                  size={13}
                  strokeWidth={2}
                  aria-label="Pinned conversation"
                  className="shrink-0 fill-[#7C828B] text-[#7C828B] dark:fill-[#A1A7B0] dark:text-[#A1A7B0]"
                />
              )}
            </span>
            <span
              className={[
                "shrink-0 text-[11px]",
                hasUnread
                  ? "font-medium text-[#6F747C] dark:text-[#A7ACB5]"
                  : "text-[#92969D]",
              ].join(" ")}
            >
              {time}
            </span>
          </span>

          <span className="mt-1.5 flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-1">
              {read && (
                <CheckCheck
                  size={15}
                  strokeWidth={1.9}
                  className="shrink-0 text-[#3B82F6]"
                />
              )}
              <span className="truncate text-[13px] text-[#777C84] dark:text-[#949AA4]">
                {preview}
              </span>
            </span>

            {hasUnread && (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] px-1.5 text-[10px] font-semibold text-white">
                {normalizedUnreadCount}
              </span>
            )}
          </span>
        </span>
      </button>

      <button
        type="button"
        aria-label={`More options for ${name}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={(event) => {
          event.stopPropagation();
          onMenuToggle(event);
        }}
        className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-[#858A92] transition-opacity hover:bg-black/[0.05] hover:text-[#4F5660] focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:hover:bg-white/[0.07] ${menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
      >
        <EllipsisVertical size={16} strokeWidth={1.9} />
      </button>
    </div>
  );
}

export default ChatListItem;
