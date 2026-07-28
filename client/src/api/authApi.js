import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

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
