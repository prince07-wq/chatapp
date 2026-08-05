import Avatar from "./Avatar.jsx";
import { ArrowLeft } from "lucide-react";

function ConversationHeader({
  avatar,
  name,
  statusText,
  online = false,
  headerActions,
  onBack,
  onOpenDetails,
}) {
  return (
    <header className="relative flex h-[92px] shrink-0 items-center border-b border-[#E8E9E6] bg-white px-4 dark:border-white/[0.06] dark:bg-[#181A1F] lg:px-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to conversations"
        className="flex h-10 w-10 items-center justify-center rounded-xl text-[#6F737B] transition-colors duration-200 hover:bg-black/[0.045] hover:text-[#202226] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 dark:text-[#9CA2AC] dark:hover:bg-white/[0.07] dark:hover:text-white md:hidden"
      >
        <ArrowLeft size={20} strokeWidth={1.9} />
      </button>

      <button type="button" onClick={onOpenDetails} disabled={!onOpenDetails} aria-label={onOpenDetails ? "Open room details" : undefined} className="hidden items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 disabled:cursor-default lg:flex">
        <Avatar {...avatar} size="lg" online={online} />
      </button>

      <button type="button" onClick={onOpenDetails} disabled={!onOpenDetails} className="absolute left-1/2 top-1/2 max-w-[42%] -translate-x-1/2 -translate-y-1/2 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/35 disabled:cursor-default">
        <h2 className="truncate text-[20px] font-semibold tracking-[-0.025em] text-[#202226] dark:text-[#F4F5F6]">
          {name}
        </h2>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-[12px] text-[#7B8087] dark:text-[#969CA6]">
          <span>{statusText}</span>
          {online && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#7D838C] dark:bg-[#A2A8B1]" />
          )}
        </div>
      </button>

      <div className="ml-auto flex items-center gap-0.5">{headerActions}</div>
    </header>
  );
}

export default ConversationHeader;
