import { useRef, useState } from "react";

export default function useChatSocket() {
  const socketRef = useRef(null);
  const joinedRoomRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);

  return { socketRef, joinedRoomRef, socketConnected, setSocketConnected };
}
