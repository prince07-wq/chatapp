export function loadHiddenMessageIds(userId) {
  if (!userId) return new Set();
  try {
    const stored = JSON.parse(localStorage.getItem(`hiddenMessages:${userId}`));
    return new Set(Array.isArray(stored) ? stored.map(String) : []);
  } catch {
    return new Set();
  }
}

export function saveHiddenMessageIds(userId, ids) {
  if (userId) {
    localStorage.setItem(`hiddenMessages:${userId}`, JSON.stringify([...ids]));
  }
}
