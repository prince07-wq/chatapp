import { Check, CheckCheck } from "lucide-react";

function MessageBubble({
  text,
  senderType,
  timestamp,
  edited = false,
  deliveryStatus,
  attachmentPlaceholder,
  breakBefore = false,
}) {
  const sent = senderType === "sent";

  return (
    <div
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
          {attachmentPlaceholder}
          {text}
        </div>

        <span className="mt-1 flex items-center gap-1.5 px-1 text-[10px] text-[#969AA1] dark:text-[#737A84]">
          {timestamp}
          {edited && <span>Edited</span>}
          {deliveryStatus === "read" && (
            <CheckCheck size={14} strokeWidth={2} className="text-[#3B82F6]" />
          )}
          {deliveryStatus === "delivered" && (
            <Check size={14} strokeWidth={2} className="text-[#3B82F6]" />
          )}
        </span>
      </div>
    </div>
  );
}

export default MessageBubble;
