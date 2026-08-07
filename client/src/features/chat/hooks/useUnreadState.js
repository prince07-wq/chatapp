import { useRef, useState } from "react";

export default function useUnreadState(initialSummaries, initialRoom) {
  const [roomSummaries, setRoomSummaries] = useState(initialSummaries);
  const [readNotificationIds, setReadNotificationIds] = useState(
    () => new Set(),
  );
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );
  const seenEmissionIdsRef = useRef(new Set());
  const pendingActiveRoomSeenRef = useRef(initialRoom);

  return {
    roomSummaries,
    setRoomSummaries,
    readNotificationIds,
    setReadNotificationIds,
    pageVisible,
    setPageVisible,
    seenEmissionIdsRef,
    pendingActiveRoomSeenRef,
  };
}
