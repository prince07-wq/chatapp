import { useEffect } from "react";
import { X } from "lucide-react";
import Avatar from "./Avatar.jsx";

function getInitials(username) {
  return (username || "User").slice(0, 2).toUpperCase();
}

function ReactionDetailsModal({ message, currentUserId, onClose, onRemove }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const entries = message.reactions.flatMap((reaction) =>
    reaction.userIds.map((userId) => {
      const user = reaction.users?.find(
        (reactionUser) => String(reactionUser.userId) === String(userId),
      );
      return {
        emoji: reaction.emoji,
        userId: String(userId),
        username: user?.username || "Unknown user",
        profileImage: user?.profileImage || "",
      };
    }),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reaction-details-title"
        className="flex max-h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-[18px] border border-[#E5E7E4] bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#1C1F24]"
      >
        <header className="flex items-center justify-between border-b border-[#ECEDEB] px-4 py-3 dark:border-white/[0.06]">
          <h2 id="reaction-details-title" className="text-[14px] font-semibold text-[#292C31] dark:text-[#F0F1F3]">
            Reactions
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close reaction details"
            className="flex h-8 w-8 items-center justify-center rounded-[9px] text-[#858A92] hover:bg-black/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 dark:hover:bg-white/[0.07]"
          >
            <X size={16} strokeWidth={1.9} />
          </button>
        </header>

        <div className="min-h-0 overflow-y-auto p-2">
          {entries.length === 0 && (
            <p className="px-3 py-8 text-center text-[12px] text-[#92969D] dark:text-[#7E858F]">
              No active reactions.
            </p>
          )}
          {entries.map((entry) => {
            const isCurrentUser = entry.userId === String(currentUserId);
            return (
              <div key={`${entry.userId}-${entry.emoji}`} className="flex items-center gap-3 rounded-[12px] px-2.5 py-2 hover:bg-[#F7F7F5] dark:hover:bg-white/[0.04]">
                <span className="w-7 shrink-0 text-center text-[20px]" aria-hidden="true">{entry.emoji}</span>
                <Avatar
                  size="sm"
                  imageSrc={entry.profileImage}
                  initials={getInitials(entry.username)}
                  tone="bg-[#E7EDF7] text-[#49637E] dark:bg-[#2B3542] dark:text-[#CFD9E6]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-[#34373C] dark:text-[#E7E9EC]">
                    {isCurrentUser ? "You" : entry.username}
                  </span>
                  <span className="block truncate text-[11px] text-[#8A8F97] dark:text-[#8F96A0]">
                    Reacted with {entry.emoji}
                  </span>
                </span>
                {isCurrentUser && (
                  <button
                    type="button"
                    onClick={() => onRemove(entry.emoji)}
                    className="shrink-0 rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold text-[#B45E5E] hover:bg-[#FBF3F3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D56B6B]/30 dark:text-[#D39494] dark:hover:bg-[#302526]"
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default ReactionDetailsModal;
