import { ArrowLeft, X } from "lucide-react";

import DMDetailsContent from "./DMDetailsContent.jsx";
import RoomDetailsContent from "./RoomDetailsContent.jsx";

export default function ConversationDetailsPanel({
  controller,
  currentUserId,
  online,
  onlineUserKeys,
  muted,
  pinned,
  archived,
  onMessageMember,
  onOpenProfile,
  onMute,
  onPin,
  onArchive,
  onCleared,
  onDelete,
  onExited,
  onFriendRemoved,
}) {
  const { open, closeDetails, details, loading, error, success } = controller;
  if (!open) return null;
  const ready = details?.room && details.room === controller.resolvedChat?.room;

  return (
    <aside className="fixed inset-0 z-[60] flex min-h-0 flex-col bg-[#F7F7F5] text-[#202226] dark:bg-[#111315] dark:text-[#F4F5F6] md:left-auto md:w-[390px] md:border-l md:border-[#E6E8E5] md:shadow-[-8px_0_24px_rgba(20,22,26,0.06)] dark:md:border-white/[0.07]">
      <header className="flex h-[72px] shrink-0 items-center gap-2 border-b border-[#E6E8E5] bg-white px-4 dark:border-white/[0.07] dark:bg-[#181A1F]"><button type="button" onClick={closeDetails} aria-label="Back to conversation" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] md:hidden"><ArrowLeft size={20} /></button><h2 className="text-[18px] font-semibold">{details?.type === "dm" ? "DM Details" : "Room Details"}</h2><button type="button" onClick={closeDetails} aria-label="Close conversation details" className="ml-auto hidden h-10 w-10 items-center justify-center rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] md:flex"><X size={19} /></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
        {loading && !ready && <p className="py-10 text-center text-[13px] text-[#8C9198]">Loading details...</p>}
        {loading && ready && <p className="mb-3 text-center text-[11px] text-[#8C9198]" role="status">Refreshing saved details...</p>}
        {error && <p className="mb-4 rounded-xl bg-[#FBF1F1] p-3 text-[12px] text-[#A55353] dark:bg-[#3A2528] dark:text-[#E3A1A1]" role="alert">{error}</p>}
        {success && <p className="mb-4 rounded-xl bg-[#EEF8F1] p-3 text-[12px] text-[#39724A] dark:bg-[#203027] dark:text-[#91D2A4]" role="status">{success}</p>}
        {ready && details.type === "room" && <RoomDetailsContent controller={controller} currentUserId={currentUserId} onlineUserKeys={onlineUserKeys} muted={muted} pinned={pinned} onMessageMember={onMessageMember} onOpenProfile={onOpenProfile} onMute={onMute} onPin={onPin} onCleared={onCleared} onExited={onExited} />}
        {ready && details.type === "dm" && <DMDetailsContent controller={controller} online={online} muted={muted} pinned={pinned} archived={archived} onViewProfile={onOpenProfile} onMute={onMute} onPin={onPin} onArchive={onArchive} onCleared={onCleared} onDelete={onDelete} onFriendRemoved={onFriendRemoved} />}
      </div>
    </aside>
  );
}
