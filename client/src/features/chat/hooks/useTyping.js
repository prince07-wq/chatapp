import { useRef, useState } from "react";

export default function useTyping({ socketRef, activeRoomRef, setMessageValue }) {
  const [typingSocketIds, setTypingSocketIds] = useState(() => new Set());
  const typingTimeoutRef = useRef(null);
  const typingRoomRef = useRef(null);
  const isTypingRef = useRef(false);

  function clearTypingTimeout() {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }

  function stopTyping() {
    clearTypingTimeout();
    if (!isTypingRef.current) return;

    const socket = socketRef.current;
    const room = typingRoomRef.current;
    if (socket?.connected && room) socket.emit("typing_stop", { room });

    isTypingRef.current = false;
    typingRoomRef.current = null;
  }

  function handleMessageChange(event) {
    const value = event.target.value;
    setMessageValue(value);
    clearTypingTimeout();

    if (!value.trim()) {
      stopTyping();
      return;
    }

    const socket = socketRef.current;
    const room = activeRoomRef.current;
    if (!socket?.connected) return;

    if (!isTypingRef.current || typingRoomRef.current !== room) {
      stopTyping();
      socket.emit("typing_start", { room });
      isTypingRef.current = true;
      typingRoomRef.current = room;
    }

    typingTimeoutRef.current = setTimeout(stopTyping, 700);
  }

  return {
    typingSocketIds,
    setTypingSocketIds,
    typingTimeoutRef,
    typingRoomRef,
    isTypingRef,
    clearTypingTimeout,
    stopTyping,
    handleMessageChange,
  };
}
