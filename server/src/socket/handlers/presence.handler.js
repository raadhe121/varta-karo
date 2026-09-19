import { ConversationParticipant, User } from '../../models/index.js';
import { addSocket, removeSocket } from '../presence.js';

const OFFLINE_GRACE_MS = 5000;
const pendingOfflineTimers = new Map(); // userId -> Timeout

async function conversationRoomsFor(userId) {
  const rows = await ConversationParticipant.findAll({ where: { userId } });
  return rows.map((r) => `conversation:${r.conversationId}`);
}

export async function handleConnect(io, socket) {
  const timer = pendingOfflineTimers.get(socket.userId);
  if (timer) {
    clearTimeout(timer);
    pendingOfflineTimers.delete(socket.userId);
  }

  socket.join(`user:${socket.userId}`);
  const rooms = await conversationRoomsFor(socket.userId);
  rooms.forEach((room) => socket.join(room));

  const wasOffline = addSocket(socket.userId, socket.id);
  if (wasOffline) {
    await User.update({ status: 'online' }, { where: { id: socket.userId } });
    rooms.forEach((room) =>
      socket.to(room).emit('presence:update', { userId: socket.userId, status: 'online', lastSeenAt: null })
    );
  }
}

export function handleDisconnect(io, socket) {
  const isNowOffline = removeSocket(socket.userId, socket.id);
  if (!isNowOffline) return;

  const timer = setTimeout(async () => {
    pendingOfflineTimers.delete(socket.userId);
    const lastSeenAt = new Date();
    await User.update({ status: 'offline', lastSeenAt }, { where: { id: socket.userId } });
    const rooms = await conversationRoomsFor(socket.userId);
    rooms.forEach((room) =>
      io.to(room).emit('presence:update', { userId: socket.userId, status: 'offline', lastSeenAt })
    );
  }, OFFLINE_GRACE_MS);

  pendingOfflineTimers.set(socket.userId, timer);
}
