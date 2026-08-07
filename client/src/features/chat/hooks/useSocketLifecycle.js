/* eslint-disable react-hooks/exhaustive-deps, react-hooks/immutability */
import { useEffect, useRef } from "react";
import TransportManager from "../../../transports/TransportManager.js";

import { getOnlineUsers } from "../../../api/userApi.js";
import { dedupeRequest } from "../../../api/requestDedup.js";
import { getAccessToken } from "../../../utils/tokenStorage.js";

function presenceNameKey(username) {
  return username ? `name:${username.trim().toLowerCase()}` : null;
}

export default function useSocketLifecycle({
  chat,
  currentUserId,
  events,
}) {
  const eventsRef = useRef(events);
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);

  useEffect(() => {
    const token = getAccessToken();
    const socketUrl = import.meta.env.VITE_SOCKET_URL;
    if (!token || !socketUrl) {
      console.error("Socket connection requires an access token and VITE_SOCKET_URL.");
      return undefined;
    }

    const transport = new TransportManager();
const socket = transport.connect({
  url: socketUrl,
  auth: { token },
});
    chat.socketRef.current = socket;
    const registrations = [];
    const register = (eventName, handler) => {
  transport.on(eventName, handler);
  registrations.push([eventName, handler]);
};

    function handleConnect() {
      const room = chat.activeRoomRef.current;
      chat.setSocketConnected(true);
      if (room && chat.joinedRoomRef.current !== room) {
        transport.joinConversation(room);
        chat.joinedRoomRef.current = room;
      }
      dedupeRequest(
        `chat:online:${currentUserId}`,
        () => getOnlineUsers(),
      )
        .then((users) => {
          if (chat.socketRef.current !== socket) return;
          const peers = users
            .filter((peer) => peer?.userId != null && String(peer.userId) !== String(currentUserId))
            .map((peer) => ({
              userId: String(peer.userId),
              username: peer.username || "User",
              displayName: peer.displayName || "",
              bio: peer.bio || "",
              profileImage: peer.profileImage || "",
            }));
          chat.setAvailableDmUsers((current) =>
            Array.from(new Map([...current, ...peers].map((peer) => [peer.userId, peer])).values()),
          );
          chat.setOnlineUserKeys(
            new Set(
              peers.flatMap((peer) => [`id:${peer.userId}`, presenceNameKey(peer.username)]).filter(Boolean),
            ),
          );
        })
        .catch((error) => {
          console.error("[users] online_error", error.response?.data?.message ?? error.message);
        });
    }

    function handleDisconnect(reason) {
      chat.joinedRoomRef.current = null;
      chat.setSocketConnected(false);
      chat.seenEmissionIdsRef.current = new Set();
      chat.clearTypingTimeout();
      chat.isTypingRef.current = false;
      chat.typingRoomRef.current = null;
      chat.setTypingSocketIds(new Set());
      chat.setOnlineUserKeys(new Set());
      chat.setActiveRoomMemberSocketIds(new Set());
      chat.setActiveRoomMembers([]);
      if (reason === "io server disconnect") socket.connect();
    }

    function handleSocketError(error) {
      console.error("[socket] error", error?.message ?? error);
      chat.setAttachmentError(error?.message ?? "Unable to send message.");
    }

    register("connect", handleConnect);
    register("disconnect", handleDisconnect);
    register("connect_error", (error) => console.error("[socket] connect_error", error?.message ?? error));
    register("socket_error", handleSocketError);
    register("error", handleSocketError);
    Object.keys(events).forEach((eventName) => {
      register(eventName, (...args) => eventsRef.current[eventName]?.(...args));
    });

 return () => {
  chat.stopTyping();

  if (socket.connected && chat.joinedRoomRef.current) {
    transport.leaveConversation(chat.joinedRoomRef.current);
  }

  registrations.forEach(([eventName, handler]) => {
    transport.off(eventName, handler);
  });

  transport.disconnect();

  if (chat.socketRef.current === socket) {
    chat.socketRef.current = null;
  }

  chat.joinedRoomRef.current = null;
};
}, [currentUserId]);
}
