import { User } from '../../models/index.js';
import { isOnline } from '../presence.js';
import { setPendingInvite, takePendingInvite, startActiveCall, endActiveCall } from '../activeCalls.js';

function publicUser(user) {
  const { id, name, username, avatarUrl, avatarColor } = user;
  return { id, name, username, avatarUrl, avatarColor };
}

export function registerCallHandlers(io, socket) {
  socket.on('call:invite', async ({ toUserId, conversationId, callType, offer }) => {
    if (!toUserId || !conversationId || !offer) return;
    if (!isOnline(toUserId)) {
      socket.emit('call:unavailable', { toUserId, conversationId });
      return;
    }
    const fromUser = await User.findByPk(socket.userId);
    if (!fromUser) return;
    const normalizedType = callType === 'video' ? 'video' : 'audio';
    setPendingInvite(socket.userId, { toUserId, conversationId, callType: normalizedType });
    io.to(`user:${toUserId}`).emit('call:incoming', {
      fromUserId: socket.userId,
      fromUser: publicUser(fromUser),
      conversationId,
      callType: normalizedType,
      offer,
    });
  });

  socket.on('call:answer', ({ toUserId, answer }) => {
    if (!toUserId || !answer) return;
    const invite = takePendingInvite(toUserId);
    if (invite && invite.toUserId === socket.userId) {
      startActiveCall(toUserId, socket.userId, invite.conversationId, invite.callType);
    }
    io.to(`user:${toUserId}`).emit('call:answered', { fromUserId: socket.userId, answer });
    // Other devices of the answering user (e.g. web + mobile both signed in) can stop ringing.
    socket.to(`user:${socket.userId}`).emit('call:cancel-ring', { fromUserId: toUserId });
  });

  socket.on('call:ice-candidate', ({ toUserId, candidate }) => {
    if (!toUserId || !candidate) return;
    io.to(`user:${toUserId}`).emit('call:ice-candidate', { fromUserId: socket.userId, candidate });
  });

  socket.on('call:decline', ({ toUserId }) => {
    if (!toUserId) return;
    takePendingInvite(toUserId);
    io.to(`user:${toUserId}`).emit('call:declined', { fromUserId: socket.userId });
    socket.to(`user:${socket.userId}`).emit('call:cancel-ring', { fromUserId: toUserId });
  });

  socket.on('call:end', ({ toUserId }) => {
    if (!toUserId) return;
    endActiveCall(socket.userId);
    io.to(`user:${toUserId}`).emit('call:ended', { fromUserId: socket.userId });
  });

  // Sent by a client that just reconnected (page refresh) and found it still
  // has an active call server-side. The peer tears down its now-dead
  // RTCPeerConnection and renegotiates fresh, without the call ever "ending".
  socket.on('call:resume-offer', ({ toUserId, offer }) => {
    if (!toUserId || !offer) return;
    io.to(`user:${toUserId}`).emit('call:resume-offer', { fromUserId: socket.userId, offer });
  });

  socket.on('call:resume-answer', ({ toUserId, answer }) => {
    if (!toUserId || !answer) return;
    io.to(`user:${toUserId}`).emit('call:resume-answer', { fromUserId: socket.userId, answer });
  });
}
