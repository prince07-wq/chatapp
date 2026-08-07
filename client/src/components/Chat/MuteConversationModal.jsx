import { useEffect } from "react";
import { BellOff, X } from "lucide-react";

const MUTE_OPTIONS = [
  { value: "1h", label: "For 1 hour" },
  { value: "8h", label: "For 8 hours" },
  { value: "1w", label: "For 1 week" },
  { value: "forever", label: "Until unmuted" },
];

function MuteConversationModal({ conversation, onClose, onSelect }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
        aria-labelledby="mute-conversation-title"
        className="w-full max-w-sm rounded-[18px] border border-[#E5E7E4] bg-white p-5 shadow-2xl dark:border-white/[0.08] dark:bg-[#1C1F24]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="mute-conversation-title" className="text-[16px] font-semibold text-[#292C31] dark:text-[#F0F1F3]">
              Mute {conversation?.name || "conversation"}
            </h2>
            <p className="mt-2 text-[13px] leading-5 text-[#747A82] dark:text-[#A1A7B0]">
              Messages and unread counts will still appear in your chat list.
              Only your notifications will be muted.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close mute conversation options"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[#858A92] hover:bg-black/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 dark:hover:bg-white/[0.07]"
          >
            <X size={16} strokeWidth={1.9} />
          </button>
        </div>

        <div className="mt-4 grid gap-1.5">
          {MUTE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] font-medium text-[#44484F] hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:text-[#E1E3E7] dark:hover:bg-white/[0.07]"
            >
              <BellOff size={16} strokeWidth={1.9} />
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default MuteConversationModal;
