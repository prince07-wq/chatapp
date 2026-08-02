import { CheckCheck } from "lucide-react";

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
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "mb-1 flex w-full items-center gap-3 rounded-[15px] px-3 py-3.5 text-left",
        "transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30",
        active
          ? "bg-[#EEF4FD] ring-1 ring-inset ring-[#3B82F6]/10 dark:bg-[#3B82F6]/10 dark:ring-[#3B82F6]/15"
          : "hover:bg-[#F7F7F5] dark:hover:bg-[#20242B]",
      ].join(" ")}
    >
      <Avatar {...avatar} size="md" online={online} />

      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[14px] font-semibold text-[#25272B] dark:text-[#F0F1F3] xl:text-[15px]">
            {name}
          </span>
          <span
            className={[
              "shrink-0 text-[11px]",
              unreadCount
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

          {unreadCount && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] px-1.5 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

export default ChatListItem;
