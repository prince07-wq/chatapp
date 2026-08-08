import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  CheckCheck,
  Download,
  FileText,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Reply as ReplyIcon,
  SmilePlus,
  Trash2,
} from "lucide-react";
import { getReplyPreviewText } from "../../utils/messageReply.js";

function formatAudioDuration(value) {
  if (!Number.isFinite(value) || value < 0) return "0:00";

  const seconds = Math.floor(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const VOICE_WAVEFORM = [
  8, 14, 20, 11, 17, 24, 13, 19, 9, 22, 16, 26, 12, 18, 23, 10, 15, 21,
  8, 17, 25, 13, 20, 11,
];

const REACTION_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
const MORE_REACTION_OPTIONS = [
  "😀", "😊", "😍", "🤔", "👏", "🙏", "🎉", "💯", "✅",
  "👀", "🤝", "🤯", "🥳", "😡", "🤗", "💀", "🚀", "💔",
];

const MENU_GAP = 4;
const VIEWPORT_MARGIN = 8;

function getMenuPosition(anchorRect, menuRect, alignRight) {
  const width = menuRect?.width || 176;
  const height = menuRect?.height || 180;
  const preferredLeft = alignRight ? anchorRect.right - width : anchorRect.left;
  const left = Math.min(
    Math.max(preferredLeft, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN),
  );
  const below = anchorRect.bottom + MENU_GAP;
  const above = anchorRect.top - height - MENU_GAP;
  const preferredTop = below + height <= window.innerHeight - VIEWPORT_MARGIN
    ? below
    : above;
  const top = Math.min(
    Math.max(preferredTop, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN),
  );
  return { left, top };
}

function getReactionPickerPosition(menuRect, pickerRect, preferLeft) {
  const width = pickerRect?.width || 208;
  const height = pickerRect?.height || 184;
  const leftSide = menuRect.left - width - VIEWPORT_MARGIN;
  const rightSide = menuRect.right + VIEWPORT_MARGIN;
  const preferredLeft = preferLeft ? leftSide : rightSide;
  const alternateLeft = preferLeft ? rightSide : leftSide;
  const fits = (left) =>
    left >= VIEWPORT_MARGIN && left + width <= window.innerWidth - VIEWPORT_MARGIN;
  const left = fits(preferredLeft)
    ? preferredLeft
    : fits(alternateLeft)
      ? alternateLeft
      : Math.min(
          Math.max(preferredLeft, VIEWPORT_MARGIN),
          Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN),
        );
  const top = Math.min(
    Math.max(menuRect.top, VIEWPORT_MARGIN),
    Math.max(VIEWPORT_MARGIN, window.innerHeight - height - VIEWPORT_MARGIN),
  );
  return { left, top };
}

function isSingleEmoji(value) {
  const emoji = value.trim();
  if (!emoji || emoji.length > 32) return false;

  const segments = [
    ...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(emoji),
  ];
  return (
    segments.length === 1 &&
    (/\p{Extended_Pictographic}/u.test(emoji) ||
      /\p{Regional_Indicator}/u.test(emoji) ||
      /^[#*0-9]\uFE0F?\u20E3$/u.test(emoji))
  );
}

function AudioAttachment({ attachment, sent }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    function handleMetadata() {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      } else {
        audio.currentTime = Number.MAX_SAFE_INTEGER;
      }
    }

    function handleDurationChange() {
      if (!Number.isFinite(audio.duration)) return;
      setDuration(audio.duration);

      if (audio.currentTime > audio.duration) {
        audio.currentTime = 0;
      }
    }

    function handleTimeUpdate() {
      if (
        Number.isFinite(audio.duration) &&
        audio.currentTime <= audio.duration
      ) {
        setCurrentTime(audio.currentTime);
      }
    }

    function handleEnded() {
      setPlaying(false);
      setCurrentTime(0);
    }

    audio.addEventListener("loadedmetadata", handleMetadata);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", handleMetadata);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [attachment.fileUrl]);

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  return (
    <div className="flex w-[230px] max-w-full items-center gap-3">
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          sent
            ? "bg-white/95 text-[#3B82F6]"
            : "bg-[#3B82F6] text-white dark:bg-[#4B8DF7]",
        ].join(" ")}
      >
        {playing ? (
          <Pause size={15} fill="currentColor" strokeWidth={1.8} />
        ) : (
          <Play size={15} fill="currentColor" strokeWidth={1.8} />
        )}
      </button>
      <span className="min-w-0 flex-1">
        <span
          className="flex h-7 items-center gap-[2px]"
          aria-hidden="true"
        >
          {VOICE_WAVEFORM.map((height, index) => {
            const played = index / VOICE_WAVEFORM.length <= progress;

            return (
              <span
                key={`${height}-${index}`}
                className={[
                  "w-[3px] shrink-0 rounded-full transition-colors duration-150",
                  sent
                    ? played
                      ? "bg-white"
                      : "bg-white/45"
                    : played
                      ? "bg-[#3B82F6] dark:bg-[#6AA0F8]"
                      : "bg-[#B8BCC2] dark:bg-[#666D77]",
                ].join(" ")}
                style={{ height }}
              />
            );
          })}
        </span>
        <span
          className={[
            "block tabular-nums text-[10px] leading-none",
            sent
              ? "text-white/75"
              : "text-[#8C9198] dark:text-[#9AA0A9]",
          ].join(" ")}
        >
          {formatAudioDuration(currentTime)} / {formatAudioDuration(duration)}
        </span>
      </span>
      <audio ref={audioRef} src={attachment.fileUrl} preload="metadata" />
    </div>
  );
}

function MessageBubble({
  messageId,
  text,
  senderType,
  timestamp,
  edited = false,
  deliveryStatus,
  attachment,
  replyTo,
  reactions = [],
  currentUserId,
  breakBefore = false,
  highlighted = false,
  onReply,
  onReact,
  onOpenReactionDetails,
  onReplyQuoteClick,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
}) {
  const sent = senderType === "sent";
  const [menuOpen, setMenuOpen] = useState(false);
  const [reactionPickerOpen, setReactionPickerOpen] = useState(false);
  const [moreReactionsOpen, setMoreReactionsOpen] = useState(false);
  const [customEmoji, setCustomEmoji] = useState("");
  const [quoteUnavailable, setQuoteUnavailable] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const [morePickerPosition, setMorePickerPosition] = useState({ left: 0, top: 0 });
  const actionButtonRef = useRef(null);
  const menuPanelRef = useRef(null);
  const morePickerRef = useRef(null);
  const imageAttachment = attachment?.mimeType?.startsWith("image/");
  const audioAttachment = attachment?.mimeType?.startsWith("audio/");
  const visibleReactions = reactions.slice(0, 2);
  const hiddenReactionCount = Math.max(0, reactions.length - 2);

  const updateMenuPosition = useCallback(() => {
    const anchorRect = actionButtonRef.current?.getBoundingClientRect();
    if (!anchorRect) return;
    const next = getMenuPosition(
      anchorRect,
      menuPanelRef.current?.getBoundingClientRect(),
      sent,
    );
    setMenuPosition((current) =>
      current.left === next.left && current.top === next.top ? current : next,
    );
  }, [sent]);

  const updateMorePickerPosition = useCallback(() => {
    const menuRect = menuPanelRef.current?.getBoundingClientRect();
    if (!menuRect) return;
    const next = getReactionPickerPosition(
      menuRect,
      morePickerRef.current?.getBoundingClientRect(),
      sent,
    );
    setMorePickerPosition((current) =>
      current.left === next.left && current.top === next.top ? current : next,
    );
  }, [sent]);

  useLayoutEffect(() => {
    if (!menuOpen) return;
    updateMenuPosition();
    if (moreReactionsOpen) updateMorePickerPosition();
  }, [menuOpen, menuPosition.left, menuPosition.top, moreReactionsOpen, reactionPickerOpen, updateMenuPosition, updateMorePickerPosition]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function closeMenu(event) {
      if (
        !actionButtonRef.current?.contains(event.target) &&
        !menuPanelRef.current?.contains(event.target)
      ) {
        setMenuOpen(false);
        setReactionPickerOpen(false);
        setMoreReactionsOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setReactionPickerOpen(false);
      setMoreReactionsOpen(false);
    }
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("resize", updateMorePickerPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("scroll", updateMorePickerPosition, true);
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("resize", updateMorePickerPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("scroll", updateMorePickerPosition, true);
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, updateMenuPosition, updateMorePickerPosition]);

  function toggleMenu() {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    const anchorRect = actionButtonRef.current?.getBoundingClientRect();
    if (anchorRect) setMenuPosition(getMenuPosition(anchorRect, null, sent));
    setMenuOpen(true);
  }

  function selectReaction(emoji) {
    setMenuOpen(false);
    setReactionPickerOpen(false);
    setMoreReactionsOpen(false);
    setCustomEmoji("");
    onReact?.(emoji);
  }

  function handleQuoteClick() {
    if (onReplyQuoteClick?.(replyTo?.messageId) === false) {
      setQuoteUnavailable(true);
    }
  }

  return (
    <div
      data-message-id={messageId}
      className={[
        "group relative flex",
        sent ? "justify-end" : "justify-start",
        breakBefore ? "mt-7" : "mt-2",
      ].join(" ")}
    >
      {(onReply || onReact || (sent && (onEdit || onDeleteForMe || onDeleteForEveryone))) && (
        <div className="relative mr-1 self-start">
          <button
            ref={actionButtonRef}
            type="button"
            aria-label="Message actions"
            aria-expanded={menuOpen}
            onClick={toggleMenu}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#969AA1] opacity-0 transition-opacity hover:bg-black/[0.04] focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/30 group-hover:opacity-100 dark:hover:bg-white/[0.06]"
          >
            <MoreHorizontal size={17} />
          </button>
          {menuOpen && createPortal(
            <div
              ref={menuPanelRef}
              className="fixed z-[100] w-44 rounded-[12px] border border-[#E6E8E5] bg-white p-1.5 text-left shadow-lg dark:border-white/[0.08] dark:bg-[#20242B]"
              style={menuPosition}
            >
              {onReact && (
                <>
                  <button type="button" onClick={() => setReactionPickerOpen((open) => !open)} className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-[12px] font-medium text-[#555B63] hover:bg-[#F7F7F5] dark:text-[#C5C9CF] dark:hover:bg-white/[0.06]">
                    <SmilePlus size={14} /> React
                  </button>
                  {reactionPickerOpen && (
                    <div className="grid grid-cols-7 gap-0.5 border-b border-[#ECEDEB] px-0.5 pb-1.5 dark:border-white/[0.06]" aria-label="Choose a reaction">
                      {REACTION_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          aria-label={`React with ${emoji}`}
                          onClick={() => selectReaction(emoji)}
                          className="flex h-5 w-5 items-center justify-center rounded-md text-[14px] hover:bg-[#F1F2F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 dark:hover:bg-white/[0.08]"
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        type="button"
                        aria-label="More reactions"
                        aria-expanded={moreReactionsOpen}
                        onClick={() => setMoreReactionsOpen((open) => !open)}
                        className="flex h-5 w-5 items-center justify-center rounded-md border border-[#DFE1DE] text-[#737880] hover:bg-[#F1F2F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 dark:border-white/[0.1] dark:text-[#B4B8BF] dark:hover:bg-white/[0.08]"
                      >
                        <Plus size={12} strokeWidth={2} />
                      </button>
                    </div>
                  )}
                  {reactionPickerOpen && moreReactionsOpen && (
                    <div
                      ref={morePickerRef}
                      role="dialog"
                      aria-label="More emoji reactions"
                      className="fixed z-[110] w-52 rounded-[12px] border border-[#E6E8E5] bg-white p-2 shadow-xl dark:border-white/[0.08] dark:bg-[#20242B]"
                      style={morePickerPosition}
                    >
                      <div className="grid grid-cols-6 gap-1">
                        {MORE_REACTION_OPTIONS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            aria-label={`React with ${emoji}`}
                            onClick={() => selectReaction(emoji)}
                            className="flex h-7 w-7 items-center justify-center rounded-[7px] text-[17px] hover:bg-[#F1F2F0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 dark:hover:bg-white/[0.08]"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <form
                        className="mt-2 flex gap-1.5 border-t border-[#ECEDEB] pt-2 dark:border-white/[0.06]"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const emoji = customEmoji.trim();
                          if (isSingleEmoji(emoji)) selectReaction(emoji);
                        }}
                      >
                        <input
                          type="text"
                          value={customEmoji}
                          onChange={(event) => setCustomEmoji(event.target.value)}
                          maxLength={32}
                          aria-label="Paste any emoji"
                          placeholder="Paste emoji"
                          className="h-8 min-w-0 flex-1 rounded-[8px] border border-[#E2E4E1] bg-[#F7F7F5] px-2 text-[12px] text-[#35383D] outline-none focus:border-[#3B82F6]/40 focus:ring-2 focus:ring-[#3B82F6]/10 dark:border-white/[0.08] dark:bg-[#292D34] dark:text-[#ECEEF1]"
                        />
                        <button
                          type="submit"
                          disabled={!isSingleEmoji(customEmoji)}
                          className="h-8 rounded-[8px] bg-[#3B82F6] px-2.5 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Add
                        </button>
                      </form>
                    </div>
                  )}
                </>
              )}
              {onReply && (
                <button type="button" onClick={() => { setMenuOpen(false); onReply(); }} className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-[12px] font-medium text-[#555B63] hover:bg-[#F7F7F5] dark:text-[#C5C9CF] dark:hover:bg-white/[0.06]">
                  <ReplyIcon size={14} /> Reply
                </button>
              )}
              {onEdit && (
                <button type="button" onClick={() => { setMenuOpen(false); onEdit(); }} className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-[12px] font-medium text-[#555B63] hover:bg-[#F7F7F5] dark:text-[#C5C9CF] dark:hover:bg-white/[0.06]">
                  <Pencil size={14} /> Edit
                </button>
              )}
              {onDeleteForMe && (
                <button type="button" onClick={() => { setMenuOpen(false); onDeleteForMe(); }} className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-[12px] font-medium text-[#555B63] hover:bg-[#F7F7F5] dark:text-[#C5C9CF] dark:hover:bg-white/[0.06]">
                  <Trash2 size={14} /> Delete for me
                </button>
              )}
              {onDeleteForEveryone && (
                <button type="button" onClick={() => { setMenuOpen(false); onDeleteForEveryone(); }} className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-[12px] font-medium text-[#B45E5E] hover:bg-[#FBF3F3] dark:text-[#D39494] dark:hover:bg-[#302526]">
                  <Trash2 size={14} /> Delete for everyone
                </button>
              )}
            </div>,
            document.body,
          )}
        </div>
      )}
      <div
        className={[
          "flex max-w-[82%] flex-col sm:max-w-[70%] lg:max-w-[62%]",
          sent ? "items-end" : "items-start",
        ].join(" ")}
      >
        <div
          className={[
            "relative rounded-[16px] px-4 py-2.5 text-[14px] leading-6 sm:text-[15px]",
            "shadow-[0_2px_7px_rgba(20,22,26,0.025)]",
            sent
              ? "rounded-br-[6px] bg-[#3B82F6] text-white"
              : "rounded-bl-[6px] border border-black/[0.035] bg-white text-[#25272B] dark:border-white/[0.05] dark:bg-[#20242B] dark:text-[#ECEEF1]",
            highlighted
              ? "ring-2 ring-[#3B82F6]/40 ring-offset-2 ring-offset-[#F7F7F5] dark:ring-offset-[#111315]"
              : "",
            reactions.length > 0 ? "mb-3 pb-4" : "",
          ].join(" ")}
        >
          {replyTo?.messageId && (
            <button
              type="button"
              onClick={handleQuoteClick}
              className={[
                "mb-2 block w-full min-w-0 rounded-[9px] border-l-2 px-2.5 py-1.5 text-left",
                sent
                  ? "border-white/80 bg-white/15 hover:bg-white/20"
                  : "border-[#3B82F6] bg-black/[0.035] hover:bg-black/[0.055] dark:bg-white/[0.06] dark:hover:bg-white/[0.09]",
              ].join(" ")}
            >
              <span className={sent ? "block truncate text-[10px] font-semibold text-white/90" : "block truncate text-[10px] font-semibold text-[#3B82F6]"}>
                {replyTo.senderUsername || "Unknown user"}
              </span>
              <span className={sent ? "block truncate text-[11px] leading-4 text-white/75" : "block truncate text-[11px] leading-4 text-[#73777E] dark:text-[#A3A8B0]"}>
                {quoteUnavailable
                  ? "Original message unavailable"
                  : getReplyPreviewText(replyTo)}
              </span>
            </button>
          )}
          {imageAttachment && (
            <a
              href={attachment.fileUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${attachment.fileName || "image attachment"}`}
              className="block"
            >
              <img
                src={attachment.fileUrl}
                alt={attachment.fileName || "Image attachment"}
                className="max-h-64 w-full rounded-[11px] object-cover"
              />
            </a>
          )}
          {audioAttachment && (
            <AudioAttachment attachment={attachment} sent={sent} />
          )}
          {attachment && !imageAttachment && !audioAttachment && (
            <a
              href={attachment.fileUrl}
              target="_blank"
              rel="noreferrer"
              download={attachment.fileName}
              className={[
                "flex min-w-[210px] items-center gap-2.5 rounded-[11px] p-2.5",
                sent
                  ? "bg-white/15 text-white hover:bg-white/20"
                  : "bg-black/[0.035] text-[#35383D] hover:bg-black/[0.055] dark:bg-white/[0.06] dark:text-[#ECEEF1] dark:hover:bg-white/[0.09]",
              ].join(" ")}
            >
              <FileText size={21} strokeWidth={1.7} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
                {attachment.fileName || "Download file"}
              </span>
              <Download size={16} strokeWidth={1.8} className="shrink-0" />
            </a>
          )}
          {text && (
            <span className={attachment ? "mt-2 block" : undefined}>{text}</span>
          )}
          {reactions.length > 0 && (
            <div className="absolute -bottom-3 right-2 z-10 flex max-w-[calc(100%-16px)] flex-nowrap justify-end gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Message reactions">
              {visibleReactions.map((reaction) => {
                const reactedByCurrentUser = reaction.userIds.some(
                  (userId) => String(userId) === String(currentUserId),
                );

                return (
                  <button
                    key={reaction.emoji}
                    type="button"
                    onClick={onOpenReactionDetails}
                    aria-pressed={reactedByCurrentUser}
                    aria-label={`${reaction.emoji} reaction, ${reaction.userIds.length}`}
                    className={[
                      "flex h-6 shrink-0 items-center gap-1 rounded-full border px-2 text-[11px] leading-none shadow-sm transition-colors",
                      reactedByCurrentUser
                        ? "border-[#3B82F6]/45 bg-[#EAF2FF] text-[#2F6FD1] dark:bg-[#21334F] dark:text-[#8AB4F8]"
                        : "border-[#D9DCD8] bg-white text-[#565C64] hover:bg-[#F7F7F5] dark:border-white/[0.12] dark:bg-[#252930] dark:text-[#D1D4D9] dark:hover:bg-[#2B3038]",
                    ].join(" ")}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="tabular-nums">{reaction.userIds.length}</span>
                  </button>
                );
              })}
              {hiddenReactionCount > 0 && (
                <button
                  type="button"
                  onClick={onOpenReactionDetails}
                  aria-label={`View ${hiddenReactionCount} more reactions`}
                  className="flex h-6 shrink-0 items-center rounded-full border border-[#D9DCD8] bg-white px-2 text-[11px] font-semibold leading-none text-[#656A72] shadow-sm hover:bg-[#F7F7F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 dark:border-white/[0.12] dark:bg-[#252930] dark:text-[#D1D4D9] dark:hover:bg-[#2B3038]"
                >
                  +{hiddenReactionCount}
                </button>
              )}
            </div>
          )}
        </div>

        <span className="mt-1 flex items-center gap-1.5 px-1 text-[10px] text-[#969AA1] dark:text-[#737A84]">
          {timestamp}
          {edited && <span>Edited</span>}
          {deliveryStatus === "seen" && (
            <span className="flex items-center gap-1 text-[#3B82F6]">
              Seen
              <CheckCheck size={14} strokeWidth={2} />
            </span>
          )}
          {deliveryStatus === "delivered" && (
            <span className="flex items-center gap-1">
              Delivered
              <CheckCheck size={14} strokeWidth={2} />
            </span>
          )}
          {deliveryStatus === "sent" && (
            <span className="flex items-center gap-1">
              Sent
              <Check size={14} strokeWidth={2} />
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

export default MessageBubble;
