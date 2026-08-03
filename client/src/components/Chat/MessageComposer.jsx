import { useEffect, useRef, useState } from "react";
import {
  FileText,
  LoaderCircle,
  Mic,
  Paperclip,
  Send,
  Smile,
  X,
} from "lucide-react";
import { getReplyPreviewText } from "../../utils/messageReply.js";

function formatRecordingDuration(value) {
  const seconds = Math.max(0, Math.floor(value));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

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
  selectedFile,
  onFileSelect,
  onFileRemove,
  error,
  recordingState = "idle",
  recordingDuration = 0,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  editingMessage,
  onCancelEdit,
  replyingTo,
  onCancelReply,
}) {
  const inactive = disabled || loading;
  const recording = recordingState === "recording";
  const preparingRecording = recordingState === "processing";
  const recordingActive = recording || preparingRecording;
  const sendDisabled = inactive || preparingRecording;
  const fileInputRef = useRef(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  useEffect(() => {
    if (!selectedFile?.type?.startsWith("image/")) {
      setImagePreviewUrl(null);
      return undefined;
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    setImagePreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (!recording) return undefined;

    function handleRecordingKeyDown(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        onStopRecording?.();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onCancelRecording?.();
      }
    }

    document.addEventListener("keydown", handleRecordingKeyDown);
    return () => document.removeEventListener("keydown", handleRecordingKeyDown);
  }, [recording, onCancelRecording, onStopRecording]);

  function handleSubmit(event) {
    event.preventDefault();
    if (sendDisabled) return;
    if (recording) onStopRecording?.();
    else onSend?.(value);
  }

  function handleFileChange(event) {
    const [file] = event.target.files;
    if (file) onFileSelect?.(file);
    event.target.value = "";
  }

  return (
    <footer className="shrink-0 border-t border-[#E8E9E6] bg-white px-4 py-3 dark:border-white/[0.06] dark:bg-[#181A1F] lg:px-5">
      {(editingMessage || replyingTo || selectedFile || error) && (
        <div className="mx-auto mb-2 flex max-w-[1180px] items-center">
          <div className="flex max-w-full items-center gap-2.5 rounded-[13px] border border-[#E7E8E5] bg-[#F7F7F5] p-2 pr-2.5 dark:border-white/[0.06] dark:bg-[#20242B]">
            {editingMessage && (
              <>
                <span className="text-[11px] font-semibold text-[#3B82F6]">Editing message</span>
                <button type="button" onClick={onCancelEdit} disabled={inactive} aria-label="Cancel editing" className="flex h-7 w-7 items-center justify-center rounded-lg text-[#858A92] hover:bg-black/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 dark:hover:bg-white/[0.07]">
                  <X size={15} strokeWidth={1.9} />
                </button>
              </>
            )}
            {replyingTo && (
              <>
                <span className="min-w-0 max-w-[280px] border-l-2 border-[#3B82F6] pl-2.5">
                  <span className="block truncate text-[10px] font-semibold text-[#3B82F6]">
                    Replying to {replyingTo.senderUsername || "message"}
                  </span>
                  <span className="block truncate text-[11px] text-[#777C84] dark:text-[#A3A8B0]">
                    {getReplyPreviewText(replyingTo)}
                  </span>
                </span>
                <button type="button" onClick={onCancelReply} disabled={inactive} aria-label="Cancel reply" className="flex h-7 w-7 items-center justify-center rounded-lg text-[#858A92] hover:bg-black/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 dark:hover:bg-white/[0.07]">
                  <X size={15} strokeWidth={1.9} />
                </button>
              </>
            )}
            {selectedFile && (
              <>
                {imagePreviewUrl ? (
                  <img
                    src={imagePreviewUrl}
                    alt="Selected attachment preview"
                    className="h-10 w-10 rounded-[9px] object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-white text-[#777C84] dark:bg-[#292D34] dark:text-[#AEB3BB]">
                    <FileText size={19} strokeWidth={1.8} />
                  </span>
                )}
                <span className="min-w-0 max-w-[260px]">
                  <span className="block truncate text-[12px] font-medium text-[#35383D] dark:text-[#E4E6E9]">
                    {selectedFile.name}
                  </span>
                  <span className="block text-[10px] text-[#92969D]">
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </span>
                </span>
                <button
                  type="button"
                  onClick={onFileRemove}
                  disabled={inactive}
                  aria-label="Remove attachment"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#858A92] transition-colors duration-200 hover:bg-black/[0.05] hover:text-[#35383D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 dark:hover:bg-white/[0.07] dark:hover:text-white"
                >
                  <X size={15} strokeWidth={1.9} />
                </button>
              </>
            )}
            {error && (
              <span className="text-[11px] font-medium text-[#C45151] dark:text-[#E18A8A]">
                {error}
              </span>
            )}
          </div>
        </div>
      )}
      <form
        className="mx-auto flex max-w-[1180px] items-center gap-2.5"
        onSubmit={handleSubmit}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt"
          onChange={handleFileChange}
          className="hidden"
        />
        {recordingActive ? (
          <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-[15px] border border-[#E7E8E5] bg-[#F7F7F5] px-4 dark:border-white/[0.06] dark:bg-[#20242B]">
            <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[#D85A5A] motion-reduce:animate-none" />
            <div
              className="flex h-6 min-w-0 flex-1 items-center gap-[3px] overflow-hidden"
              aria-hidden="true"
            >
              {[5, 9, 13, 7, 17, 11, 6, 15, 9, 18, 7, 13, 5, 11, 16, 8, 12, 6].map(
                (height, index) => (
                  <span
                    key={`${height}-${index}`}
                    className="w-1 shrink-0 animate-pulse rounded-full bg-[#A6AAB1] motion-reduce:animate-none dark:bg-[#777E88]"
                    style={{
                      height,
                      animationDelay: `${index * 55}ms`,
                      animationDuration: "900ms",
                    }}
                  />
                ),
              )}
            </div>
            <span className="shrink-0 tabular-nums text-[12px] font-medium text-[#555A62] dark:text-[#D8DBDF]">
              {formatRecordingDuration(recordingDuration)}
            </span>
            <button
              type="button"
              onClick={onCancelRecording}
              disabled={preparingRecording}
              aria-label="Cancel recording"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#858A92] transition-colors duration-200 hover:bg-black/[0.05] hover:text-[#D85A5A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D85A5A]/30 disabled:opacity-45 dark:hover:bg-white/[0.07]"
            >
              <X size={17} strokeWidth={1.9} />
            </button>
          </div>
        ) : (
          <>
            <ComposerIconButton
              label="Attach a file"
              disabled={inactive || Boolean(editingMessage)}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip size={20} strokeWidth={1.8} />
            </ComposerIconButton>
            <ComposerIconButton
              label="Choose an emoji"
              className="hidden sm:flex"
              disabled={inactive || Boolean(editingMessage)}
            >
              <Smile size={20} strokeWidth={1.8} />
            </ComposerIconButton>

            <div className="flex h-12 min-w-0 flex-1 items-center rounded-[15px] border border-[#E7E8E5] bg-[#F7F7F5] px-4 transition-colors duration-200 focus-within:border-[#3B82F6]/35 focus-within:ring-2 focus-within:ring-[#3B82F6]/10 dark:border-white/[0.06] dark:bg-[#20242B]">
              <input
                type="text"
                aria-label="Message"
                value={value}
                onChange={onChange}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && (editingMessage || replyingTo)) {
                    event.preventDefault();
                    if (editingMessage) onCancelEdit?.();
                    else onCancelReply?.();
                  }
                }}
                placeholder={placeholder}
                disabled={inactive}
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[#292B2F] outline-none placeholder:text-[#9A9EA5] dark:text-[#F1F2F4] dark:placeholder:text-[#777E88]"
              />
              <button
                type="button"
                aria-label="Record a voice message"
                onClick={onStartRecording}
                disabled={inactive || Boolean(editingMessage)}
                className="ml-2 flex h-8 w-8 items-center justify-center rounded-[10px] text-[#848991] transition-colors duration-200 hover:bg-black/[0.04] hover:text-[#3B82F6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 dark:hover:bg-white/[0.06]"
              >
                <Mic size={18} strokeWidth={1.8} />
              </button>
            </div>
          </>
        )}

        <button
          type="submit"
          aria-label={editingMessage ? "Save edited message" : recording ? "Send voice message" : "Send message"}
          aria-busy={loading}
          disabled={sendDisabled}
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
