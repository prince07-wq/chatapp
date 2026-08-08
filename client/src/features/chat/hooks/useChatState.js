import { useRef, useState } from "react";

import { chats, INITIAL_ROOM, messages } from "../constants/chatConfig.js";
import useChatSocket from "./useChatSocket.js";
import useConversationPreferences from "./useConversationPreferences.js";
import useMessageActions from "./useMessageActions.js";
import useMessageHistory from "./useMessageHistory.js";
import usePresence from "./usePresence.js";
import useTyping from "./useTyping.js";
import useUnreadState from "./useUnreadState.js";

export default function useChatState({ currentUserId, transport }) {
  const [activeRoom, setActiveRoom] = useState(INITIAL_ROOM);
  const [activeDmRecipientId, setActiveDmRecipientId] = useState(null);
  const [searchRoomChats, setSearchRoomChats] = useState([]);
  const [searchMessageTarget, setSearchMessageTarget] = useState(null);
  const [availableDmUsers, setAvailableDmUsers] = useState([]);
  const [dmConversationUserIds, setDmConversationUserIds] = useState(
    () => new Set(),
  );
  const [activeProfileChat, setActiveProfileChat] = useState(null);
  const [loadingDmUsers, setLoadingDmUsers] = useState(true);
  const [dmUsersError, setDmUsersError] = useState("");
  const [incomingFriendCount, setIncomingFriendCount] = useState(0);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState([]);
  const [friendsRefreshVersion, setFriendsRefreshVersion] = useState(0);
  const [friendsInitialTab, setFriendsInitialTab] = useState("friends");
  const [friendActivityNotifications, setFriendActivityNotifications] =
    useState([]);
  const [relativeTimeNow, setRelativeTimeNow] = useState(() => Date.now());
  const activeRoomRef = useRef(INITIAL_ROOM);
  const activeDmRecipientIdRef = useRef(null);

  const preferences = useConversationPreferences({
    currentUserId,
    now: relativeTimeNow,
  });
  const unread = useUnreadState(
    () =>
      Object.fromEntries(
        chats.map((chat) => [
          chat.room,
          {
            unreadCount: Math.max(0, chat.unread ?? 0),
            latestMessage: null,
          },
        ]),
      ),
    INITIAL_ROOM,
  );
  const history = useMessageHistory(messages);
  const messageActions = useMessageActions();
  const presence = usePresence();
  const connection = useChatSocket();
  const typing = useTyping({
    activeRoomRef,
    setMessageValue: messageActions.setMessageValue,
    transport,
  });

  return {
    activeRoom,
    setActiveRoom,
    activeDmRecipientId,
    setActiveDmRecipientId,
    searchRoomChats,
    setSearchRoomChats,
    searchMessageTarget,
    setSearchMessageTarget,
    availableDmUsers,
    setAvailableDmUsers,
    dmConversationUserIds,
    setDmConversationUserIds,
    activeProfileChat,
    setActiveProfileChat,
    loadingDmUsers,
    setLoadingDmUsers,
    dmUsersError,
    setDmUsersError,
    incomingFriendCount,
    setIncomingFriendCount,
    incomingFriendRequests,
    setIncomingFriendRequests,
    friendsRefreshVersion,
    setFriendsRefreshVersion,
    friendsInitialTab,
    setFriendsInitialTab,
    friendActivityNotifications,
    setFriendActivityNotifications,
    relativeTimeNow,
    setRelativeTimeNow,
    activeRoomRef,
    activeDmRecipientIdRef,
    ...preferences,
    ...unread,
    ...history,
    ...messageActions,
    ...presence,
    ...connection,
    ...typing,
  };
}
