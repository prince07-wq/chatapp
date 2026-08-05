export function getConversationDetailsPermissions(details, currentUserId) {
  if (details?.type !== "room") {
    return {
      isOwner: false,
      canManageRoom: false,
      canManageAdmins: false,
      canRemoveMembers: false,
    };
  }

  const currentMember = details.members?.find(
    (member) => String(member.userId) === String(currentUserId),
  );
  const isOwner = currentMember?.role === "owner";
  const isAdmin = currentMember?.role === "admin";
  return {
    isOwner,
    canManageRoom: isOwner || isAdmin,
    canManageAdmins: isOwner,
    canRemoveMembers: isOwner || isAdmin,
  };
}
