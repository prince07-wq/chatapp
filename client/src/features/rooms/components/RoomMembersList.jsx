import { MessageCircle, Shield, UserMinus } from "lucide-react";
import Avatar from "../../../components/Chat/Avatar.jsx";
import { resolveUploadedFileUrl } from "../../../api/fileApi.js";

export default function RoomMembersList({ members, currentUserId, onlineUserKeys, permissions, disabled = false, onProfile, onMessage, onRemove, onRoleChange }) {
  return <div className="space-y-1">{members.map((member) => {
    const self = String(member.userId) === String(currentUserId);
    const online = onlineUserKeys.has(`id:${member.userId}`);
    return <div key={member.userId} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-black/[0.025] dark:hover:bg-white/[0.04]">
      <button type="button" onClick={() => onProfile(member)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <Avatar size="sm" imageSrc={resolveUploadedFileUrl(member.profileImage)} initials={member.username.slice(0, 2).toUpperCase()} online={online} tone="bg-[#E4ECF7] text-[#355A7A] dark:bg-[#2B3848] dark:text-[#C5DBEE]" />
        <span className="min-w-0"><span className="block truncate text-[13px] font-medium">{member.username}{self ? " (You)" : ""}</span><span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#8C9198]">{member.role !== "member" && <Shield size={11} />}{member.role}</span></span>
      </button>
      {!self && <button type="button" disabled={disabled} aria-label={`Message ${member.username}`} onClick={() => onMessage(member)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#777D86] hover:bg-black/[0.05] disabled:opacity-50 dark:hover:bg-white/[0.07]"><MessageCircle size={16} /></button>}
      {permissions.canManageAdmins && member.role !== "owner" && <button type="button" disabled={disabled} onClick={() => onRoleChange(member.userId, member.role === "admin" ? "member" : "admin")} className="rounded-lg px-2 py-1 text-[10px] font-semibold text-[#3B82F6] disabled:opacity-50">{member.role === "admin" ? "Demote" : "Promote"}</button>}
      {permissions.canRemoveMembers && !self && member.role !== "owner" && <button type="button" disabled={disabled} aria-label={`Remove ${member.username}`} onClick={() => onRemove(member.userId)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B65A5A] hover:bg-[#FBF3F3] disabled:opacity-50 dark:hover:bg-[#302526]"><UserMinus size={16} /></button>}
    </div>;
  })}</div>;
}
