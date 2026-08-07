import { useState } from "react";

export default function usePresence() {
  const [onlineUserKeys, setOnlineUserKeys] = useState(() => new Set());
  const [activeRoomMemberSocketIds, setActiveRoomMemberSocketIds] = useState(
    () => new Set(),
  );
  const [activeRoomMembers, setActiveRoomMembers] = useState([]);

  return {
    onlineUserKeys,
    setOnlineUserKeys,
    activeRoomMemberSocketIds,
    setActiveRoomMemberSocketIds,
    activeRoomMembers,
    setActiveRoomMembers,
  };
}
