import { User } from '../../models/index.js';
import { isOnline } from '../presence.js';

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
    io.to(`user:${toUserId}`).emit('call:incoming', {
      fromUserId: socket.userId,
      fromUser: publicUser(fromUser),
      conversationId,
      callType: callType === 'video' ? 'video' : 'audio',
      offer,
    });
  });

  socket.on('call:answer', ({ toUserId, answer }) => {
    if (!toUserId || !answer) return;
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
    io.to(`user:${toUserId}`).emit('call:declined', { fromUserId: socket.userId });
    socket.to(`user:${socket.userId}`).emit('call:cancel-ring', { fromUserId: toUserId });
  });

  socket.on('call:end', ({ toUserId }) => {
    if (!toUserId) return;
    io.to(`user:${toUserId}`).emit('call:ended', { fromUserId: socket.userId });
  });
}
