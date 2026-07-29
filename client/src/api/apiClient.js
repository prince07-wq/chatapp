import axios from "axios";
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveAccessToken,
} from "../utils/tokenStorage.js";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

const refreshClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

let refreshPromise = null;
let authFailureHandler = null;

function clearAuthentication() {
  clearSession();
  authFailureHandler?.();
}

export function setAuthFailureHandler(handler) {
  authFailureHandler = handler;

  return () => {
    if (authFailureHandler === handler) {
      authFailureHandler = null;
    }
  };
}

function isAuthenticationRequest(url = "") {
  return [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
  ].some((path) => url.includes(path));
}

export function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuthentication();
    return Promise.reject(new Error("No refresh token is available."));
  }

  refreshPromise = refreshClient
    .post("/auth/refresh", { refreshToken })
    .then(({ data }) => {
      if (!data?.accessToken) {
        throw new Error("Refresh response has no access token.");
      }

      saveAccessToken(data.accessToken);
      return data.accessToken;
    })
    .catch((error) => {
      clearAuthentication();
      throw error;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      !originalRequest ||
      status !== 401 ||
      originalRequest._retry ||
      isAuthenticationRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);
