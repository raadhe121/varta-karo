import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { API_ORIGIN } from '../config/env';

let socket = null;
let socketToken = null;

// Idempotent: several call sites "ensure a socket exists". Reusing the live
// instance (rather than always reconnecting) keeps listeners already
// attached to it valid instead of orphaning them.
export function connectSocket() {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) return null;

  if (socket && socketToken === accessToken) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socketToken = accessToken;
  socket = io(API_ORIGIN, {
    auth: { token: accessToken },
    transports: ['websocket'],
  });

  // Connection failures are otherwise silent — sends look like they just do
  // nothing and incoming events never arrive, with no clue why.
  socket.on('connect_error', (err) => console.warn('[socket] connect_error:', err.message, API_ORIGIN));
  socket.on('connect', () => console.log('[socket] connected to', API_ORIGIN));
  socket.on('disconnect', (reason) => console.log('[socket] disconnected:', reason));

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}

export function getSocket() {
  return socket;
}
