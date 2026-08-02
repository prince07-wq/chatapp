import { LoaderCircle, Mic, Paperclip, Send, Smile } from "lucide-react";

function ComposerIconButton({ label, children, className = "", ...props }) {
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

function MessageComposer({
  value,
  onChange,
  onSend,
  placeholder = "Type a message...",
  disabled = false,
  loading = false,
}) {
  const inactive = disabled || loading;

  function handleSubmit(event) {
    event.preventDefault();
    if (!inactive) onSend?.(value);
  }

  return (
    <footer className="shrink-0 border-t border-[#E8E9E6] bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-[#181A1F] lg:px-5">
      <form
        className="mx-auto flex max-w-[1180px] items-center gap-2.5"
        onSubmit={handleSubmit}
      >
        <ComposerIconButton label="Attach a file" disabled={inactive}>
          <Paperclip size={20} strokeWidth={1.8} />
        </ComposerIconButton>
        <ComposerIconButton
          label="Choose an emoji"
          className="hidden sm:flex"
          disabled={inactive}
        >
          <Smile size={20} strokeWidth={1.8} />
        </ComposerIconButton>

        <div className="flex h-12 min-w-0 flex-1 items-center rounded-[15px] border border-[#E7E8E5] bg-[#F7F7F5] px-4 transition-colors duration-200 focus-within:border-[#3B82F6]/35 focus-within:ring-2 focus-within:ring-[#3B82F6]/10 dark:border-white/[0.06] dark:bg-[#20242B]">
          <input
            type="text"
            aria-label="Message"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={inactive}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[#292B2F] outline-none placeholder:text-[#9A9EA5] dark:text-[#F1F2F4] dark:placeholder:text-[#777E88]"
          />
          <button
            type="button"
            aria-label="Record a voice message"
            disabled={inactive}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-[10px] text-[#848991] transition-colors duration-200 hover:bg-black/[0.04] hover:text-[#3B82F6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:hover:bg-white/[0.06]"
          >
            <Mic size={18} strokeWidth={1.8} />
          </button>
        </div>

        <button
          type="submit"
          aria-label="Send message"
          aria-busy={loading}
          disabled={inactive}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#3B82F6] text-white shadow-[0_4px_12px_rgba(59,130,246,0.16)] transition-colors duration-200 hover:bg-[#3478E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#181A1F]"
        >
          {loading ? (
            <LoaderCircle size={20} strokeWidth={1.9} className="animate-spin" />
          ) : (
            <Send size={20} strokeWidth={1.9} />
          )}
        </button>
      </form>
    </footer>
  );
}

export default MessageComposer;
