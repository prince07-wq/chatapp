import { api } from "./apiClient.js";

export async function getOnlineUsers({ signal } = {}) {
  const { data } = await api.get("/users/online", { signal });
  return Array.isArray(data?.users) ? data.users : [];
}

export async function getFriends({ signal } = {}) {
  const { data } = await api.get("/users/friends", { signal });
  return {
    friends: Array.isArray(data?.friends) ? data.friends : [],
    incoming: Array.isArray(data?.incoming) ? data.incoming : [],
    outgoing: Array.isArray(data?.outgoing) ? data.outgoing : [],
  };
}

export async function searchUsers(username, { signal } = {}) {
  const { data } = await api.get("/users/search", {
    params: { username },
    signal,
  });
  return Array.isArray(data?.users) ? data.users : [];
}

export async function sendFriendRequest(userId) {
  const { data } = await api.post("/users/friend-requests", { userId });
  return data;
}

export async function respondToFriendRequest(requestId, action) {
  const { data } = await api.patch(`/users/friend-requests/${requestId}`, {
    action,
  });
  return data;
}

export async function cancelFriendRequest(requestId) {
  const { data } = await api.delete(`/users/friend-requests/${requestId}`);
  return data;
}

export async function removeFriend(friendId) {
  const { data } = await api.delete(`/users/friends/${friendId}`);
  return data;
}
