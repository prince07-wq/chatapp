import { useMemo, useState } from "react";
import { Camera, Plus, Save } from "lucide-react";

import Avatar from "../../../components/Chat/Avatar.jsx";
import { resolveUploadedFileUrl } from "../../../api/fileApi.js";
import AddMembersModal from "../../rooms/components/AddMembersModal.jsx";
import RoomMembersList from "../../rooms/components/RoomMembersList.jsx";
import RoomSettingsSection from "../../rooms/components/RoomSettingsSection.jsx";
import { getConversationDetailsPermissions } from "../utils/conversationDetailsPermissions.js";
import SharedMediaGrid from "./SharedMediaGrid.jsx";

export default function RoomDetailsContent({
  controller,
  currentUserId,
  onlineUserKeys,
  muted,
  pinned,
  onMessageMember,
  onOpenProfile,
  onMute,
  onPin,
  onCleared,
  onExited,
}) {
  const { details, media, mediaHasMore, pendingAction } = controller;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const permissions = getConversationDetailsPermissions(details, currentUserId);
  const memberIds = useMemo(
    () => new Set(details.members.map((member) => String(member.userId))),
    [details.members],
  );
  const busy = Boolean(pendingAction);

  async function submitEdit() {
    const result = await controller.updateRoom(draft);
    if (result.ok) setEditing(false);
  }

  async function handleClear() {
    const result = await controller.clear();
    if (result.ok) onCleared();
  }

  async function handleExit() {
    const result = await controller.exitRoom();
    if (result.ok) {
      setConfirmExit(false);
      controller.closeDetails();
      onExited(result.result);
    }
  }

  return (
    <>
      <section className="text-center">
        <div className="relative mx-auto w-fit">
          <Avatar size="lg" imageSrc={resolveUploadedFileUrl(details.avatar)} initials={details.name.slice(0, 2).toUpperCase()} group tone="bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]" />
          {permissions.canManageRoom && (
            <label className={`absolute -bottom-1 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#3B82F6] text-white ${busy ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
              <Camera size={14} />
              <input type="file" accept="image/*" disabled={busy} className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) controller.updateAvatar(file); event.target.value = ""; }} />
            </label>
          )}
        </div>
        {editing ? (
          <div className="mt-4 space-y-2">
            <input value={draft.name} maxLength={80} disabled={busy} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="h-10 w-full rounded-xl border border-[#E5E7E4] bg-white px-3 text-[13px] disabled:opacity-60 dark:border-white/[0.08] dark:bg-[#20242B]" />
            <textarea value={draft.description} maxLength={500} disabled={busy} onChange={(event) => setDraft({ ...draft, description: event.target.value })} className="min-h-20 w-full rounded-xl border border-[#E5E7E4] bg-white p-3 text-[13px] disabled:opacity-60 dark:border-white/[0.08] dark:bg-[#20242B]" />
            <button type="button" disabled={busy} onClick={submitEdit} className="inline-flex items-center gap-1 rounded-lg bg-[#3B82F6] px-3 py-2 text-[12px] font-semibold text-white disabled:opacity-50"><Save size={14} />{pendingAction === "save-room" ? "Saving..." : "Save"}</button>
          </div>
        ) : (
          <>
            <h3 className="mt-3 text-[20px] font-semibold">{details.name}</h3>
            <p className="mt-1 text-[12px] text-[#858A92]">{details.description || "No description"}</p>
            {permissions.canManageRoom && <button type="button" disabled={busy} onClick={() => { setDraft({ name: details.name, description: details.description }); setEditing(true); }} className="mt-2 text-[12px] font-medium text-[#3B82F6] disabled:opacity-50">Edit room</button>}
          </>
        )}
        <p className="mt-3 text-[10px] uppercase tracking-wide text-[#9A9EA5]">Created {new Date(details.createdAt).toLocaleDateString()} · {details.memberCount} members</p>
      </section>

      <section className="mt-7">
        <div className="mb-2 flex items-center justify-between"><h3 className="text-[13px] font-semibold">Members</h3>{permissions.canManageRoom && <button type="button" disabled={busy} onClick={() => setShowAdd(true)} className="flex items-center gap-1 text-[11px] font-semibold text-[#3B82F6] disabled:opacity-50"><Plus size={14} />Add</button>}</div>
        <RoomMembersList members={details.members} currentUserId={currentUserId} onlineUserKeys={onlineUserKeys} permissions={permissions} disabled={busy} onProfile={onOpenProfile} onMessage={onMessageMember} onRemove={controller.removeMember} onRoleChange={controller.setMemberRole} />
      </section>

      <section className="mt-7"><h3 className="mb-3 text-[13px] font-semibold">Shared media</h3><SharedMediaGrid items={media} hasMore={mediaHasMore} loading={pendingAction === "load-media"} onLoadMore={controller.loadMoreMedia} /></section>
      <section className="mt-7"><h3 className="mb-2 text-[13px] font-semibold">Room settings</h3><RoomSettingsSection muted={muted} pinned={pinned} disabled={busy} onMute={onMute} onPin={() => controller.perform("pin", onPin, "Pin preference saved.")} onClear={handleClear} onExit={() => setConfirmExit(true)} /></section>

      {showAdd && <AddMembersModal existingIds={memberIds} error={controller.error} onAdd={controller.addMembers} onClose={() => setShowAdd(false)} />}
      {confirmExit && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 p-4" role="presentation"><div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-[18px] bg-white p-5 dark:bg-[#20242B]"><h3 className="text-[17px] font-semibold">Exit this group?</h3><p className="mt-2 text-[12px] text-[#858A92]">You will be removed from the persisted member list. Shared history remains for other members.</p><div className="mt-5 flex justify-end gap-2"><button type="button" disabled={busy} onClick={() => setConfirmExit(false)} className="rounded-xl px-4 py-2 text-[12px]">Cancel</button><button type="button" disabled={busy} onClick={handleExit} className="rounded-xl bg-[#B65A5A] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50">{pendingAction === "exit" ? "Exiting..." : "Exit group"}</button></div></div></div>}
    </>
  );
}
