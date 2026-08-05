import { api } from "../../../api/apiClient.js";
import { uploadFile } from "../../../api/fileApi.js";
import { removeFriend } from "../../../api/userApi.js";
import {
  addRoomMembers,
  leaveRoom,
  removeRoomMember,
  setRoomMemberRole,
  updateRoomDetails,
} from "../../rooms/api/roomApi.js";

const detailsPath = (room) =>
  `/conversation-details/${encodeURIComponent(room)}`;

export async function getConversationDetails(room, { signal } = {}) {
  const { data } = await api.get(detailsPath(room), { signal });
  return data;
}

export async function getConversationMedia(room, page = 1, { signal } = {}) {
  const { data } = await api.get(`${detailsPath(room)}/media`, {
    params: { page },
    signal,
  });
  return data;
}

export async function saveRoomDetails(room, changes) {
  return updateRoomDetails(room, changes);
}

export async function saveRoomAvatar(room, file) {
  const uploaded = await uploadFile(file);
  if (!uploaded?.url) throw new Error("Image upload did not return a URL.");
  return updateRoomDetails(room, { avatar: uploaded.url });
}

export { addRoomMembers, leaveRoom, removeFriend, removeRoomMember, setRoomMemberRole };

export async function exitRoom(room) {
  const result = await leaveRoom(room);
  return result.deletedConversations;
}

export async function clearConversation(room) {
  const { data } = await api.patch("/users/conversation-clears", { room });
  return data.clearedConversation;
}
