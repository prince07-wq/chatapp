import { api } from "./apiClient.js";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post("/files/upload", formData);
  return data;
}

export function resolveUploadedFileUrl(fileUrl) {
  if (!fileUrl || /^https?:\/\//i.test(fileUrl)) return fileUrl;

  const fallbackOrigin =
    typeof window === "undefined" ? "http://localhost" : window.location.origin;
  const apiOrigin = new URL(API_URL, fallbackOrigin).origin;

  return new URL(fileUrl, apiOrigin).toString();
}
