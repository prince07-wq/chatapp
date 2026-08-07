import { api } from "./apiClient.js";

export const MESSAGE_PAGE_SIZE = 20;

export async function getRoomMessagePage(
  room,
  page,
  { signal, limit = MESSAGE_PAGE_SIZE } = {},
) {
  const { data } = await api.get(`/messages/${encodeURIComponent(room)}`, {
    params: { page, limit },
    signal,
  });

  return data;
}

export async function getPrivateMessagePage(
  recipientId,
  page,
  { signal, limit = MESSAGE_PAGE_SIZE } = {},
) {
  const { data } = await api.get(
    `/messages/private/${encodeURIComponent(recipientId)}`,
    {
      params: { page, limit },
      signal,
    },
  );

  return data;
}

export async function editMessage(messageId, message) {
  const { data } = await api.patch(`/messages/${messageId}`, { message });
  return data;
}

export async function deleteMessage(messageId) {
  const { data } = await api.delete(`/messages/${messageId}`);
  return data;
}
