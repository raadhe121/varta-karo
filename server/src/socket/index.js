import { verifyAccessToken } from '../services/token.service.js';
import { registerMessageHandlers } from './handlers/message.handler.js';
import { registerTypingHandlers } from './handlers/typing.handler.js';
import { registerCallHandlers } from './handlers/call.handler.js';
import { handleConnect, handleDisconnect } from './handlers/presence.handler.js';
import { attachRandomChat } from './random.js';

export function attachSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.warn(`[socket] rejected connection from ${socket.handshake.address}: missing auth token`);
      return next(new Error('Missing auth token'));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      next();
    } catch (err) {
      console.warn(`[socket] rejected connection from ${socket.handshake.address}: ${err.message}`);
      next(new Error('Invalid or expired auth token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[socket] user ${socket.userId} connected (${socket.id}) from ${socket.handshake.address}`);
    handleConnect(io, socket);
    registerMessageHandlers(io, socket);
    registerTypingHandlers(io, socket);
    registerCallHandlers(io, socket);

    socket.on('disconnect', () => handleDisconnect(io, socket));
  });

  attachRandomChat(io);
}
