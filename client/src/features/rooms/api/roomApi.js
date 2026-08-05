import { api } from "../../../api/apiClient.js";

const pathFor = (room) => `/rooms/${encodeURIComponent(room)}`;

export async function getRoomDetails(room, { signal } = {}) { return (await api.get(pathFor(room), { signal })).data; }
export async function updateRoomDetails(room, changes) { return (await api.patch(pathFor(room), changes)).data; }
export async function getRoomMedia(room, page = 1, { signal } = {}) { return (await api.get(`${pathFor(room)}/media`, { params: { page }, signal })).data; }
export async function addRoomMembers(room, userIds) { return (await api.post(`${pathFor(room)}/members`, { userIds })).data; }
export async function removeRoomMember(room, userId) { return (await api.delete(`${pathFor(room)}/members/${encodeURIComponent(userId)}`)).data; }
export async function setRoomMemberRole(room, userId, role) { return (await api.patch(`${pathFor(room)}/members/${encodeURIComponent(userId)}/role`, { role })).data; }
export async function leaveRoom(room) { return (await api.post(`${pathFor(room)}/leave`)).data; }
export async function searchRoomCandidates(username, { signal } = {}) { return (await api.get("/users/search", { params: { username }, signal })).data?.users ?? []; }
