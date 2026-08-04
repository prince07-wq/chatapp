import { api } from "./apiClient.js";

export async function updateProfile(changes) {
  const { data } = await api.patch("/users/profile", changes);
  return data;
}
