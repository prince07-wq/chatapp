import { useRef, useState } from "react";

export default function useChatSocket() {
  const joinedRoomRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);

  return { joinedRoomRef, socketConnected, setSocketConnected };
}
