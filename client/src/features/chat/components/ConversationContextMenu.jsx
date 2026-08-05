import { Archive, ArchiveRestore, BellOff, Pin, Trash2 } from "lucide-react";

export default function ConversationContextMenu({
  menu,
  chatItems,
  pinned,
  muted,
  archived,
  onClose,
  onTogglePin,
  onRequestMute,
  onToggleArchive,
  onRequestDelete,
}) {
  return (
    <div
      role="menu"
      style={{ left: menu.left, top: menu.top }}
      className="fixed z-50 min-w-44 rounded-xl border border-[#E5E6E3] bg-white p-1.5 shadow-lg dark:border-white/[0.09] dark:bg-[#24272E]"
    >
      <button
        type="button"
        role="menuitem"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
          onTogglePin(menu.room);
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-[#44484F] hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:text-[#E1E3E7] dark:hover:bg-white/[0.07]"
      >
        <Pin size={15} strokeWidth={1.9} />
        {pinned ? "Unpin conversation" : "Pin conversation"}
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={(event) => {
          event.stopPropagation();
          const chat = chatItems.find((candidate) => candidate.room === menu.room);
          onClose();
          if (chat) onRequestMute(chat);
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-[#44484F] hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:text-[#E1E3E7] dark:hover:bg-white/[0.07]"
      >
        <BellOff size={15} strokeWidth={1.9} />
        {muted ? "Unmute conversation" : "Mute conversation"}
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={(event) => {
          event.stopPropagation();
          const chat = chatItems.find((candidate) => candidate.room === menu.room);
          onClose();
          if (chat) onToggleArchive(chat);
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-[#44484F] hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:text-[#E1E3E7] dark:hover:bg-white/[0.07]"
      >
        {archived ? (
          <ArchiveRestore size={15} strokeWidth={1.9} />
        ) : (
          <Archive size={15} strokeWidth={1.9} />
        )}
        {archived ? "Unarchive conversation" : "Archive conversation"}
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={(event) => {
          event.stopPropagation();
          const chat = chatItems.find((candidate) => candidate.room === menu.room);
          onClose();
          if (chat) onRequestDelete(chat);
        }}
        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-[#B65A5A] hover:bg-[#FBF3F3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D56B6B]/30 dark:text-[#E39A9A] dark:hover:bg-[#302526]"
      >
        <Trash2 size={15} strokeWidth={1.9} />
        Delete conversation
      </button>
    </div>
  );
}
