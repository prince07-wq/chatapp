import { useEffect } from "react";
import { Trash2, X } from "lucide-react";

function DeleteConversationModal({
  conversation,
  deleting = false,
  error = "",
  onClose,
  onConfirm,
}) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !deleting) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [deleting, onClose]);

  const name = conversation?.name || "this conversation";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-[1px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !deleting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-conversation-title"
        aria-describedby="delete-conversation-description"
        className="w-full max-w-sm rounded-[18px] border border-[#E5E7E4] bg-white p-5 shadow-2xl dark:border-white/[0.08] dark:bg-[#1C1F24]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="delete-conversation-title" className="text-[16px] font-semibold text-[#292C31] dark:text-[#F0F1F3]">
              Delete conversation?
            </h2>
            <p id="delete-conversation-description" className="mt-2 text-[13px] leading-5 text-[#747A82] dark:text-[#A1A7B0]">
              This removes {name} from your chat list only. Messages, files,
              and history remain available to everyone else in the room or DM.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            aria-label="Close delete conversation confirmation"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-[#858A92] hover:bg-black/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/[0.07]"
          >
            <X size={16} strokeWidth={1.9} />
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-[#FBF1F1] px-3 py-2 text-[12px] text-[#A55353] dark:bg-[#3A2528] dark:text-[#E3A1A1]">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="h-9 rounded-[10px] px-3.5 text-[13px] font-semibold text-[#5B6169] hover:bg-[#F4F4F2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#C7CBD2] dark:hover:bg-white/[0.07]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex h-9 items-center gap-1.5 rounded-[10px] bg-[#C75B5B] px-3.5 text-[13px] font-semibold text-white hover:bg-[#B94F4F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C75B5B]/35 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={15} strokeWidth={1.9} />
            {deleting ? "Deleting..." : "Delete for me"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default DeleteConversationModal;
