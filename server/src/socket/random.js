import { randomUUID } from 'crypto';
import { Op } from 'sequelize';
import { verifyAccessToken } from '../services/token.service.js';
import { User, FriendRequest } from '../models/index.js';
import { createNotification } from '../services/notification.service.js';
import { getOrCreateDirectConversation } from '../services/conversation.service.js';

// In-memory only, by design — random-chat pairing and its messages are
// ephemeral (never written to the DB); the only thing that survives a
// session is a friend request + conversation created once a "connect" is
// actually fulfilled between two real accounts.
const queue = []; // socket ids waiting to be matched
const rooms = new Map(); // roomId -> { members: [socketId, socketId], pendingRequestFrom: userId|null }

// Random-chat identity is anonymous in both directions, regardless of
// whether either side has an account — a logged-in user's real name/avatar/
// userId must not leak to their stranger until a friend request is actually
// accepted (at which point the resulting real conversation shows their real
// profile, same as any other chat). `isGuest` is still exposed so the UI can
// say "has an account" vs "anonymous", without saying which account.
function identityOf(socket) {
  return socket.isGuest ? { isGuest: true, name: socket.guestName } : { isGuest: false, name: 'Stranger' };
}

function roomOf(socket) {
  const roomId = socket.data.roomId;
  return roomId ? rooms.get(roomId) : null;
}

function partnerSocketOf(nsp, socket) {
  const room = roomOf(socket);
  if (!room) return null;
  const partnerId = room.members.find((id) => id !== socket.id);
  return partnerId ? nsp.sockets.get(partnerId) : null;
}

function teardownRoom(nsp, socket, reason) {
  const room = roomOf(socket);
  if (!room) return;
  rooms.delete(socket.data.roomId);
  const partner = partnerSocketOf(nsp, socket);
  socket.data.roomId = null;
  if (partner) {
    partner.data.roomId = null;
    partner.emit('random:partner-left', { reason });
  }
}

function removeFromQueue(socketId) {
  const idx = queue.indexOf(socketId);
  if (idx !== -1) queue.splice(idx, 1);
}

function tryMatch(nsp) {
  while (queue.length >= 2) {
    const aId = queue.shift();
    const bId = queue.shift();
    const a = nsp.sockets.get(aId);
    const b = nsp.sockets.get(bId);
    if (!a?.connected) {
      if (b?.connected) queue.unshift(bId);
      continue;
    }
    if (!b?.connected) {
      queue.unshift(aId);
      continue;
    }

    const roomId = randomUUID();
    rooms.set(roomId, { members: [aId, bId], pendingRequestFrom: null });
    a.data.roomId = roomId;
    b.data.roomId = roomId;
    a.emit('random:matched', { roomId, partner: identityOf(b) });
    b.emit('random:matched', { roomId, partner: identityOf(a) });
  }
}

export function attachRandomChat(io) {
  const nsp = io.of('/random');

  nsp.use((socket, next) => {
    const { token, guestId, guestName } = socket.handshake.auth || {};
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        socket.isGuest = false;
        socket.userId = payload.sub;
        return next();
      } catch (err) {
        return next(new Error('Invalid or expired auth token'));
      }
    }
    if (!guestId) return next(new Error('Missing guestId for anonymous random chat'));
    socket.isGuest = true;
    socket.guestId = guestId;
    socket.guestName = (guestName && String(guestName).trim().slice(0, 24)) || `Stranger #${guestId.slice(0, 4)}`;
    return next();
  });

  nsp.on('connection', (socket) => {
    socket.data.roomId = null;

    // Registering listeners synchronously (before any await) matters: the
    // client emits 'random:join' as soon as it sees 'connect', and an event
    // that arrives before its listener is registered is dropped silently —
    // so the identity lookup below runs concurrently, not in front of this.
    const ready = socket.isGuest
      ? Promise.resolve(true)
      : User.findByPk(socket.userId).then((user) => {
          if (!user) {
            socket.disconnect();
            return false;
          }
          socket.userName = user.name;
          socket.userAvatarUrl = user.avatarUrl;
          socket.userAvatarColor = user.avatarColor;
          return true;
        });

    socket.on('random:join', async () => {
      if (!(await ready)) return;
      if (socket.data.roomId || queue.includes(socket.id)) return;
      queue.push(socket.id);
      socket.emit('random:waiting');
      tryMatch(nsp);
    });

    socket.on('random:message', ({ text } = {}) => {
      const trimmed = String(text || '').trim().slice(0, 2000);
      if (!trimmed) return;
      const partner = partnerSocketOf(nsp, socket);
      if (!partner) return;
      partner.emit('random:message', { text: trimmed, at: new Date().toISOString() });
    });

    socket.on('random:next', () => {
      teardownRoom(nsp, socket, 'next');
      removeFromQueue(socket.id);
      queue.push(socket.id);
      socket.emit('random:waiting');
      tryMatch(nsp);
    });

    socket.on('random:leave', () => {
      teardownRoom(nsp, socket, 'left');
      removeFromQueue(socket.id);
    });

    socket.on('random:send-request', async () => {
      if (socket.isGuest) return; // UI already hides this for guests
      const room = roomOf(socket);
      const partner = partnerSocketOf(nsp, socket);
      if (!room || !partner) return;

      if (!partner.isGuest) {
        await sendOrReuseFriendRequest(io, socket.userId, partner.userId);
        socket.emit('random:request-sent', { pending: false });
        return;
      }

      room.pendingRequestFrom = socket.userId;
      partner.emit('random:pending-request');
      socket.emit('random:request-sent', { pending: true });
    });

    socket.on('random:authenticate', async ({ token } = {}) => {
      if (!socket.isGuest || !token) return;
      let payload;
      try {
        payload = verifyAccessToken(token);
      } catch {
        socket.emit('random:error', { message: 'Sign-in failed, please try again.' });
        return;
      }

      const user = await User.findByPk(payload.sub);
      if (!user) return;

      socket.isGuest = false;
      socket.userId = user.id;
      socket.userName = user.name;
      socket.userAvatarUrl = user.avatarUrl;
      socket.userAvatarColor = user.avatarColor;
      socket.join(`user:${user.id}`);

      const room = roomOf(socket);
      const partner = partnerSocketOf(nsp, socket);
      if (room && room.pendingRequestFrom && room.pendingRequestFrom !== user.id) {
        const conversation = await sendOrReuseFriendRequest(io, room.pendingRequestFrom, user.id, { autoAccept: true });
        const payloadOut = { conversationId: conversation?.id };
        socket.emit('random:friend-added', payloadOut);
        partner?.emit('random:friend-added', payloadOut);
        room.pendingRequestFrom = null;
      }
    });

    socket.on('disconnect', () => {
      teardownRoom(nsp, socket, 'disconnected');
      removeFromQueue(socket.id);
    });
  });
}

async function sendOrReuseFriendRequest(io, requesterId, addresseeId, { autoAccept = false } = {}) {
  let request = await FriendRequest.findOne({
    where: {
      [Op.or]: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });

  if (!request) {
    request = await FriendRequest.create({ requesterId, addresseeId, status: autoAccept ? 'accepted' : 'pending' });
    if (!autoAccept) {
      await createNotification({ recipientId: addresseeId, actorId: requesterId, type: 'friend_request' }, io);
    }
  } else if (autoAccept && request.status !== 'accepted') {
    request.status = 'accepted';
    await request.save();
  }

  if (request.status !== 'accepted') return null;

  await createNotification({ recipientId: requesterId, actorId: addresseeId, type: 'friend_accepted' }, io).catch(() => {});
  return getOrCreateDirectConversation(io, requesterId, addresseeId);
}
