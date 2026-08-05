import { Bell } from "lucide-react";

import UserListItem from "../../components/Chat/UserListItem.jsx";
import ThemeToggle from "../../components/UI/ThemeToggle.jsx";

function avatarFor(notification) {
  const name = notification.name || "Notification";
  return {
    initials: name.slice(0, 2).toUpperCase(),
    group: notification.type === "room_message",
    tone:
      notification.type === "friend_request" ||
      notification.type === "friend_request_accepted"
        ? "bg-[#E8EEE9] text-[#4D6856] dark:bg-[#2B3830] dark:text-[#C4D9CA]"
        : "bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]",
  };
}

export default function NotificationsPage({ notifications, onOpen }) {
  return (
    <section className="col-start-1 flex min-h-0 min-w-0 flex-col bg-[#F7F7F5] dark:bg-[#111315] md:col-span-2 md:col-start-2">
      <header className="shrink-0 border-b border-[#E6E8E5] bg-white px-5 py-5 dark:border-white/[0.06] dark:bg-[#181A1F] sm:px-8">
        <div className="mx-auto flex max-w-[1050px] items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A9EA5]">
              Workspace
            </p>
            <h1 className="mt-0.5 text-[24px] font-semibold tracking-[-0.035em] text-[#1C1E22] dark:text-[#F3F4F6]">
              Notifications
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
        <div className="mx-auto max-w-[1050px] rounded-[18px] border border-[#E6E8E5] bg-white p-2 dark:border-white/[0.06] dark:bg-[#181A1F]">
          {notifications.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#F1F3F5] text-[#858B94] dark:bg-[#242830] dark:text-[#9BA1AA]">
                <Bell size={21} />
              </div>
              <p className="mt-3 text-[13px] text-[#858A92] dark:text-[#838A94]">
                You have no notifications.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <UserListItem
                key={notification.id}
                avatar={avatarFor(notification)}
                name={notification.title}
                subtitle={notification.subtitle}
                onOpenProfile={() => onOpen(notification)}
                actions={
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <span
                        className="h-2 w-2 rounded-full bg-[#3B82F6]"
                        aria-label="Unread notification"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => onOpen(notification)}
                      className="shrink-0 rounded-[10px] bg-[#3B82F6]/10 px-3 py-2 text-[12px] font-semibold text-[#3B82F6] transition-colors duration-200 hover:bg-[#3B82F6]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:bg-[#3B82F6]/15 dark:text-[#7EACF8]"
                    >
                      Open
                    </button>
                  </div>
                }
              />
            ))
          )}
        </div>
      </div>
    </section>
  );
}
