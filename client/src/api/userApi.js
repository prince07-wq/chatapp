import { api } from "./apiClient.js";

export async function getOnlineUsers({ signal } = {}) {
  const { data } = await api.get("/users/online", { signal });
  return Array.isArray(data?.users) ? data.users : [];
}
