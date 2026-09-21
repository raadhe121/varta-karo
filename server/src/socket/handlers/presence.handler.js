import { ConversationParticipant, User } from '../../models/index.js';
import { addSocket, removeSocket } from '../presence.js';
import { getActiveCall, endActiveCall } from '../activeCalls.js';

const OFFLINE_GRACE_MS = 5000;
const pendingOfflineTimers = new Map(); // userId -> Timeout

// Separate from OFFLINE_GRACE_MS: a refreshing client needs time to reload
// the page, reconnect the socket, re-acquire the camera/mic, and renegotiate
// before its peer gives up and ends the call.
const CALL_GRACE_MS = 30000;
const pendingCallEndTimers = new Map(); // userId -> Timeout

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

  const callTimer = pendingCallEndTimers.get(socket.userId);
  if (callTimer) {
    clearTimeout(callTimer);
    pendingCallEndTimers.delete(socket.userId);
  }

  const activeCall = getActiveCall(socket.userId);
  if (activeCall) {
    const peer = await User.findByPk(activeCall.peerId);
    if (peer) {
      const { id, name, username, avatarUrl, avatarColor } = peer;
      socket.emit('call:resume-available', {
        peerId: activeCall.peerId,
        peerUser: { id, name, username, avatarUrl, avatarColor },
        conversationId: activeCall.conversationId,
        callType: activeCall.callType,
      });
    }
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

  const activeCall = getActiveCall(socket.userId);
  if (activeCall) {
    socket.to(`user:${activeCall.peerId}`).emit('call:peer-reconnecting', { fromUserId: socket.userId });
    const callTimer = setTimeout(() => {
      pendingCallEndTimers.delete(socket.userId);
      const entry = endActiveCall(socket.userId);
      if (entry) {
        io.to(`user:${entry.peerId}`).emit('call:ended', { fromUserId: socket.userId });
      }
    }, CALL_GRACE_MS);
    pendingCallEndTimers.set(socket.userId, callTimer);
  }

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
