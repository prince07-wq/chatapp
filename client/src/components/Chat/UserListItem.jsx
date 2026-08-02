import Avatar from "./Avatar.jsx";

function UserListItem({
  avatar,
  name,
  online = false,
  onOpenProfile,
  onMessage,
}) {
  return (
    <div className="mb-1 flex items-center gap-3 rounded-[15px] px-3 py-3.5 transition-colors duration-200 hover:bg-[#F7F7F5] dark:hover:bg-[#20242B]">
      <button
        type="button"
        onClick={onOpenProfile}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30"
      >
        <Avatar {...avatar} size="md" online={online} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-[#25272B] dark:text-[#F0F1F3] xl:text-[15px]">
            {name}
          </span>
          <span className="mt-1 block text-[12px] text-[#92969D] dark:text-[#777E88]">
            {online ? "Online" : "Offline"}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onMessage}
        className="shrink-0 rounded-[10px] bg-[#3B82F6]/10 px-3 py-2 text-[12px] font-semibold text-[#3B82F6] transition-colors duration-200 hover:bg-[#3B82F6]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:bg-[#3B82F6]/15 dark:text-[#7EACF8]"
      >
        Message
      </button>
    </div>
  );
}

export default UserListItem;
