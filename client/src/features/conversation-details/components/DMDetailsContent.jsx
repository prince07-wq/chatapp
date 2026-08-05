import { useState } from "react";
import { Archive, Bell, Pin, Trash2, UserMinus, UserRound } from "lucide-react";

import Avatar from "../../../components/Chat/Avatar.jsx";
import { resolveUploadedFileUrl } from "../../../api/fileApi.js";
import SharedMediaGrid from "./SharedMediaGrid.jsx";

export default function DMDetailsContent({
  controller,
  online,
  muted,
  pinned,
  archived,
  onViewProfile,
  onMute,
  onPin,
  onArchive,
  onCleared,
  onDelete,
  onFriendRemoved,
}) {
  const { details, media, mediaHasMore, pendingAction } = controller;
  const [confirmRemove, setConfirmRemove] = useState(false);
  const profile = details.recipient;
  const busy = Boolean(pendingAction);
  const actionClass = "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] hover:bg-black/[0.035] disabled:opacity-50 dark:hover:bg-white/[0.05]";

  async function handleClear() {
    const result = await controller.clear();
    if (result.ok) onCleared();
  }

  async function handleRemoveFriend() {
    const result = await controller.removeDmFriend();
    if (result.ok) {
      setConfirmRemove(false);
      onFriendRemoved();
    }
  }

  return (
    <>
      <section className="text-center">
        <Avatar size="lg" imageSrc={resolveUploadedFileUrl(profile.profileImage)} initials={(profile.displayName || profile.username).slice(0, 2).toUpperCase()} online={online} onlineIndicatorClassName={online ? "bg-[#22C55E]" : undefined} tone="bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]" />
        <h3 className="mt-3 text-[20px] font-semibold">{profile.displayName || profile.username}</h3>
        <p className="mt-1 text-[12px] text-[#858A92]">@{profile.username}</p>
        <p className="mt-2 text-[12px] text-[#858A92]">{profile.bio || "No bio"}</p>
        <div className="mt-3 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wide text-[#9A9EA5]"><span>{online ? "Online" : "Offline"}</span><span>·</span><span>{details.friendshipStatus === "friend" ? "Friends" : details.friendshipStatus === "incoming" ? "Request received" : details.friendshipStatus === "outgoing" ? "Request sent" : "Not friends"}</span></div>
        <button type="button" onClick={() => onViewProfile(profile)} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#3B82F6]/10 px-3 py-2 text-[12px] font-semibold text-[#3B82F6]"><UserRound size={14} />View profile</button>
      </section>

      <section className="mt-7"><h3 className="mb-3 text-[13px] font-semibold">Shared media</h3><SharedMediaGrid items={media} hasMore={mediaHasMore} loading={pendingAction === "load-media"} onLoadMore={controller.loadMoreMedia} /></section>

      {details.sharedGroups.length > 0 && (
        <section className="mt-7"><h3 className="mb-2 text-[13px] font-semibold">Shared groups</h3><div className="space-y-1">{details.sharedGroups.map((group) => <div key={group.room} className="flex items-center gap-3 rounded-xl px-2 py-2"><Avatar size="sm" group imageSrc={resolveUploadedFileUrl(group.avatar)} initials={group.name.slice(0, 2).toUpperCase()} tone="bg-[#ECE8F3] text-[#65567B] dark:bg-[#373141] dark:text-[#D8CBE7]" /><span className="truncate text-[13px]">{group.name}</span></div>)}</div></section>
      )}

      <section className="mt-7">
        <h3 className="mb-2 text-[13px] font-semibold">Conversation settings</h3>
        <button type="button" disabled={busy} onClick={onMute} className={actionClass}><Bell size={16} /><span className="flex-1">Notifications</span><span className="text-[11px] text-[#8C9198]">{muted ? "Muted" : "On"}</span></button>
        <button type="button" disabled={busy} onClick={() => controller.perform("pin", onPin, "Pin preference saved.")} className={actionClass}><Pin size={16} /><span>{pinned ? "Unpin conversation" : "Pin conversation"}</span></button>
        <button type="button" disabled={busy} onClick={() => controller.perform("archive", onArchive, "Archive preference saved.")} className={actionClass}><Archive size={16} /><span>{archived ? "Unarchive conversation" : "Archive conversation"}</span></button>
        <button type="button" disabled={busy} onClick={handleClear} className={actionClass}><Trash2 size={16} /><span>{pendingAction === "clear" ? "Clearing..." : "Clear chat for me"}</span></button>
        <button type="button" disabled={busy} onClick={onDelete} className={`${actionClass} text-[#B65A5A] dark:text-[#E39A9A]`}><Trash2 size={16} /><span>Delete conversation for me</span></button>
        {details.friendshipStatus === "friend" && <button type="button" disabled={busy} onClick={() => setConfirmRemove(true)} className={`${actionClass} text-[#B65A5A] dark:text-[#E39A9A]`}><UserMinus size={16} /><span>Remove friend</span></button>}
      </section>

      {confirmRemove && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4" role="presentation"><div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-[18px] bg-white p-5 dark:bg-[#20242B]"><h3 className="text-[17px] font-semibold">Remove friend?</h3><p className="mt-2 text-[12px] text-[#858A92]">This removes the friendship for both users. Your direct-message history is unaffected.</p><div className="mt-5 flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => setConfirmRemove(false)} className="rounded-xl px-4 py-2 text-[12px]">Cancel</button><button type="button" disabled={busy} onClick={handleRemoveFriend} className="rounded-xl bg-[#B65A5A] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50">{pendingAction === "remove-friend" ? "Removing..." : "Remove"}</button></div></div></div>}
    </>
  );
}
