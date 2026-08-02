import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  Download,
  FileText,
  Pause,
  Play,
} from "lucide-react";

function formatAudioDuration(value) {
  if (!Number.isFinite(value) || value < 0) return "0:00";

  const seconds = Math.floor(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const VOICE_WAVEFORM = [
  8, 14, 20, 11, 17, 24, 13, 19, 9, 22, 16, 26, 12, 18, 23, 10, 15, 21,
  8, 17, 25, 13, 20, 11,
];

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
  breakBefore = false,
}) {
  const sent = senderType === "sent";
  const imageAttachment = attachment?.mimeType?.startsWith("image/");
  const audioAttachment = attachment?.mimeType?.startsWith("audio/");

  return (
    <div
      data-message-id={messageId}
      className={[
        "flex",
        sent ? "justify-end" : "justify-start",
        breakBefore ? "mt-7" : "mt-2",
      ].join(" ")}
    >
      <div
        className={[
          "flex max-w-[82%] flex-col sm:max-w-[70%] lg:max-w-[62%]",
          sent ? "items-end" : "items-start",
        ].join(" ")}
      >
        <div
          className={[
            "rounded-[16px] px-4 py-2.5 text-[14px] leading-6 sm:text-[15px]",
            "shadow-[0_2px_7px_rgba(20,22,26,0.025)]",
            sent
              ? "rounded-br-[6px] bg-[#3B82F6] text-white"
              : "rounded-bl-[6px] border border-black/[0.035] bg-white text-[#25272B] dark:border-white/[0.05] dark:bg-[#20242B] dark:text-[#ECEEF1]",
          ].join(" ")}
        >
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
