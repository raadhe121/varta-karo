// Tracks which userIds currently have at least one open socket connection.
const onlineSockets = new Map(); // userId -> Set<socketId>

export function addSocket(userId, socketId) {
  const wasOffline = !onlineSockets.has(userId) || onlineSockets.get(userId).size === 0;
  if (!onlineSockets.has(userId)) onlineSockets.set(userId, new Set());
  onlineSockets.get(userId).add(socketId);
  return wasOffline;
}

export function removeSocket(userId, socketId) {
  const set = onlineSockets.get(userId);
  if (!set) return true;
  set.delete(socketId);
  const isNowOffline = set.size === 0;
  if (isNowOffline) onlineSockets.delete(userId);
  return isNowOffline;
}

export function isOnline(userId) {
  return onlineSockets.has(userId);
}
