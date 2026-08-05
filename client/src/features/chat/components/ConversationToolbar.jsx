import { EllipsisVertical, Phone, Search, UserPlus, Video } from "lucide-react";

import ConversationHeader from "../../../components/Chat/ConversationHeader.jsx";

function IconButton({ label, children, className = "", ...props }) {
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

export default function ConversationToolbar({
  activeChat,
  activeChatOnline,
  onBack,
  onShowMembers,
}) {
  return (
    <ConversationHeader
      avatar={{
        initials: activeChat.initials,
        imageSrc: activeChat.imageSrc,
        tone: activeChat.tone,
        group: activeChat.group,
      }}
      name={activeChat.name}
      statusText={activeChatOnline ? "Online" : "Offline"}
      online={activeChatOnline}
      onBack={onBack}
      headerActions={
        <>
          <IconButton label="Start a voice call" className="hidden sm:flex">
            <Phone size={19} strokeWidth={1.8} />
          </IconButton>
          <IconButton label="Start a video call" className="hidden lg:flex">
            <Video size={20} strokeWidth={1.8} />
          </IconButton>
          <IconButton label="Search this conversation">
            <Search size={20} strokeWidth={1.8} />
          </IconButton>
          <IconButton label="View room members" onClick={onShowMembers}>
            <UserPlus size={19} strokeWidth={1.8} />
          </IconButton>
          <IconButton label="Conversation options">
            <EllipsisVertical size={20} strokeWidth={1.8} />
          </IconButton>
        </>
      }
    />
  );
}
