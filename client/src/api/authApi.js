import { api } from "./apiClient.js";

export async function registerRequest({ username, email, password }) {
  const { data } = await api.post("/auth/register", {
    username,
    email,
    password,
  });

  return data;
}

export async function loginRequest({ email, password }) {
  const { data } = await api.post("/auth/login", {
    email,
    password,
  });

  return data;
}

export async function logoutRequest(refreshToken) {
  const { data } = await api.post("/auth/logout", {
    refreshToken,
  });

  return data;
}
