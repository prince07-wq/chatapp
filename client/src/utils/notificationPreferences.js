const STORAGE_KEY = "notificationPreferences";

export const DEFAULT_NOTIFICATION_PREFERENCES = Object.freeze({
  friendRequests: true,
  directMessages: true,
  roomMessages: true,
});

export function loadNotificationPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      friendRequests: stored?.friendRequests !== false,
      directMessages: stored?.directMessages !== false,
      roomMessages: stored?.roomMessages !== false,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function saveNotificationPreferences(preferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
