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

async function getLatestMessagePage(loadPage) {
  let latestPage = await loadPage(1);

  if (latestPage.messages.length < MESSAGE_PAGE_SIZE) return latestPage;

  let lastFullPage = 1;
  let probePage = 2;

  while (true) {
    const probe = await loadPage(probePage);

    if (probe.messages.length > 0) latestPage = probe;

    if (probe.messages.length < MESSAGE_PAGE_SIZE) {
      if (probe.messages.length > 0) return probe;
      break;
    }

    lastFullPage = probePage;
    probePage *= 2;
  }

  let low = lastFullPage + 1;
  let high = probePage - 1;

  while (low <= high) {
    const middlePage = Math.floor((low + high) / 2);
    const probe = await loadPage(middlePage);

    if (probe.messages.length > 0) {
      latestPage = probe;
      low = middlePage + 1;
    } else {
      high = middlePage - 1;
    }
  }

  return latestPage;
}

export async function getLatestRoomMessagePage(room, { signal } = {}) {
  return getLatestMessagePage((page) =>
    getRoomMessagePage(room, page, { signal }),
  );
}

export async function getLatestPrivateMessagePage(
  recipientId,
  { signal } = {},
) {
  return getLatestMessagePage((page) =>
    getPrivateMessagePage(recipientId, page, { signal }),
  );
}

export async function editMessage(messageId, message) {
  const { data } = await api.patch(`/messages/${messageId}`, { message });
  return data;
}

export async function deleteMessage(messageId) {
  const { data } = await api.delete(`/messages/${messageId}`);
  return data;
}
