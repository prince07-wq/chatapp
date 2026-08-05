import { useEffect, useMemo, useRef, useState } from "react";
import { resolveUploadedFileUrl } from "../../../api/fileApi.js";

import {
  addRoomMembers,
  clearConversation,
  getConversationDetails,
  getConversationMedia,
  exitRoom as exitRoomRequest,
  removeFriend,
  removeRoomMember,
  saveRoomAvatar,
  saveRoomDetails,
  setRoomMemberRole,
} from "../api/conversationDetailsApi.js";

function errorMessage(error) {
  return error.response?.data?.error ?? error.message ?? "Unable to save changes.";
}

export default function useConversationDetails(chat, { refreshKey } = {}) {
  const room = chat?.room ?? null;
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [media, setMedia] = useState([]);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaHasMore, setMediaHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!room) return undefined;
    const controller = new AbortController();
    getConversationDetails(room, { signal: controller.signal })
      .then((savedDetails) => {
        if (!controller.signal.aborted) setDetails(savedDetails);
      })
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED" && !controller.signal.aborted) {
          setError(errorMessage(requestError));
        }
      });
    return () => controller.abort();
  }, [room, refreshKey]);

  useEffect(() => {
    if (!open || !room) return undefined;
    const controller = new AbortController();
    Promise.all([
      getConversationDetails(room, { signal: controller.signal }),
      getConversationMedia(room, 1, { signal: controller.signal }),
    ])
      .then(([savedDetails, savedMedia]) => {
        if (controller.signal.aborted) return;
        setDetails(savedDetails);
        setMedia(savedMedia.items);
        setMediaPage(1);
        setMediaHasMore(savedMedia.hasMore);
      })
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED" && !controller.signal.aborted) {
          setError(errorMessage(requestError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, room]);

  async function run(action, request, message) {
    if (pendingRef.current || !room) return { ok: false };
    pendingRef.current = true;
    setPendingAction(action);
    setError("");
    setSuccess("");
    try {
      const result = await request();
      setSuccess(message);
      return { ok: true, result };
    } catch (requestError) {
      setError(errorMessage(requestError));
      return { ok: false };
    } finally {
      pendingRef.current = false;
      setPendingAction("");
    }
  }

  async function updateRoom(changes) {
    return run("save-room", async () => {
      const saved = await saveRoomDetails(room, changes);
      setDetails({ type: "room", ...saved });
      return saved;
    }, "Room details saved.");
  }

  async function updateAvatar(file) {
    return run("save-avatar", async () => {
      const saved = await saveRoomAvatar(room, file);
      setDetails({ type: "room", ...saved });
      return saved;
    }, "Room avatar saved.");
  }

  async function addMembers(userIds) {
    return run("add-members", async () => {
      const saved = await addRoomMembers(room, userIds);
      setDetails({ type: "room", ...saved });
      return saved;
    }, "Members added.");
  }

  async function removeMember(userId) {
    return run(`remove:${userId}`, async () => {
      const saved = await removeRoomMember(room, userId);
      setDetails({ type: "room", ...saved });
      return saved;
    }, "Member removed.");
  }

  async function setMemberRole(userId, role) {
    return run(`role:${userId}`, async () => {
      const saved = await setRoomMemberRole(room, userId, role);
      setDetails({ type: "room", ...saved });
      return saved;
    }, "Member role saved.");
  }

  async function loadMoreMedia() {
    return run("load-media", async () => {
      if (!mediaHasMore) return null;
      const next = await getConversationMedia(room, mediaPage + 1);
      setMedia((current) => [
        ...current,
        ...next.items.filter(
          (item) => !current.some((existing) => existing.id === item.id),
        ),
      ]);
      setMediaPage(next.page);
      setMediaHasMore(next.hasMore);
      return next;
    }, "");
  }

  async function clear() {
    return run("clear", async () => {
      const saved = await clearConversation(room);
      setMedia([]);
      setMediaPage(1);
      setMediaHasMore(false);
      return saved;
    }, "Chat cleared for you.");
  }

  async function exitRoom() {
    return run("exit", () => exitRoomRequest(room), "You left the room.");
  }

  async function removeDmFriend() {
    const recipientId = details?.recipient?.userId;
    if (!recipientId) return { ok: false };
    const result = await run("remove-friend", () => removeFriend(recipientId), "Friend removed.");
    if (result.ok) setDetails((current) => ({ ...current, friendshipStatus: "none", friendshipRequestId: null }));
    return result;
  }

  const resolvedChat = useMemo(() => {
    if (!chat || details?.room !== chat.room) return chat;
    if (details.type === "room") {
      return {
        ...chat,
        name: details.name,
        initials: details.name.slice(0, 2).toUpperCase(),
        imageSrc: resolveUploadedFileUrl(details.avatar),
      };
    }
    const profile = details.recipient;
    const name = profile.displayName || profile.username;
    return {
      ...chat,
      name,
      username: profile.username,
      initials: name.slice(0, 2).toUpperCase(),
      imageSrc: resolveUploadedFileUrl(profile.profileImage),
    };
  }, [chat, details]);

  function openDetails() {
    if (!room) return;
    setError("");
    setSuccess("");
    setLoading(true);
    setOpen(true);
  }

  return {
    open,
    openDetails,
    closeDetails: () => setOpen(false),
    details,
    resolvedChat,
    media,
    mediaHasMore,
    loading,
    pendingAction,
    error,
    success,
    updateRoom,
    updateAvatar,
    addMembers,
    removeMember,
    setMemberRole,
    loadMoreMedia,
    clear,
    exitRoom,
    removeDmFriend,
    perform: run,
  };
}
