export function getRoomPermissions(details, currentUserId) {
  const id = String(currentUserId || "");
  const currentMember = details?.members?.find((member) => String(member.userId) === id);
  const isOwner = currentMember?.role === "owner";
  const isAdmin = currentMember?.role === "admin";
  return {
    isOwner,
    canManageRoom: isOwner || isAdmin,
    canManageAdmins: isOwner,
    canRemoveMembers: isOwner || isAdmin,
  };
}
