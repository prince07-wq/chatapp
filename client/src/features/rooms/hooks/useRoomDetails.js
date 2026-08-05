import { useEffect, useState } from "react";
import { uploadFile } from "../../../api/fileApi.js";
import { addRoomMembers, getRoomDetails, getRoomMedia, leaveRoom, removeRoomMember, setRoomMemberRole, updateRoomDetails } from "../api/roomApi.js";

export default function useRoomDetails(room) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [media, setMedia] = useState([]);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaHasMore, setMediaHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !room) return undefined;
    const controller = new AbortController();
    Promise.all([getRoomDetails(room, { signal: controller.signal }), getRoomMedia(room, 1, { signal: controller.signal })])
      .then(([nextDetails, nextMedia]) => {
        if (controller.signal.aborted) return;
        setDetails(nextDetails);
        setMedia(nextMedia.items);
        setMediaPage(1);
        setMediaHasMore(nextMedia.hasMore);
      })
      .catch((requestError) => {
        if (requestError.code !== "ERR_CANCELED") setError(requestError.response?.data?.error ?? requestError.message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open, room]);

  async function save(changes) { const next = await updateRoomDetails(room, changes); setDetails(next); }
  async function saveAvatar(file) { const uploaded = await uploadFile(file); await save({ avatar: uploaded.url }); }
  async function addMembers(userIds) { setDetails(await addRoomMembers(room, userIds)); }
  async function removeMember(userId) { setDetails(await removeRoomMember(room, userId)); }
  async function setRole(userId, role) { setDetails(await setRoomMemberRole(room, userId, role)); }
  async function loadMoreMedia() {
    if (!mediaHasMore) return;
    const next = await getRoomMedia(room, mediaPage + 1);
    setMedia((current) => [...current, ...next.items.filter((item) => !current.some((existing) => existing.id === item.id))]);
    setMediaPage(next.page);
    setMediaHasMore(next.hasMore);
  }
  async function exit() {
    const { deletedConversations } = await leaveRoom(room);
    setOpen(false);
    return deletedConversations;
  }

  function openDetails() {
    setLoading(true);
    setError("");
    setOpen(true);
  }

  return { open, openDetails, closeDetails: () => setOpen(false), details, media, mediaHasMore, loading, error, save, saveAvatar, addMembers, removeMember, setRole, loadMoreMedia, exit };
}
