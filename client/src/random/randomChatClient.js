import { io } from 'socket.io-client';
import { useRandomChatStore } from '../store/randomChatStore';

const apiOrigin = import.meta.env.VITE_API_URL ?? '';

// A singleton, deliberately independent of any component's mount lifecycle —
// the random-chat session (and its socket) must keep running while the
// widget is minimized, so Sidebar can show a live "Anonymous" entry and
// messages keep arriving even when the popup isn't on screen.
let socket = null;

export function startRandomChat(accessToken) {
  const store = useRandomChatStore.getState();
  if (socket) {
    store.show();
    return;
  }

  store.startSession();

  socket = io(`${apiOrigin}/random`, { auth: { token: accessToken }, transports: ['websocket'] });

  socket.on('connect', () => socket.emit('random:join'));
  socket.on('random:waiting', () => useRandomChatStore.getState().setWaiting());
  socket.on('random:matched', ({ partner }) => useRandomChatStore.getState().setMatched(partner));
  socket.on('random:message', ({ text, at }) => useRandomChatStore.getState().addIncomingMessage(text, at));
  socket.on('random:partner-left', () => useRandomChatStore.getState().chatEnded('partner'));
  socket.on('random:request-sent', ({ pending }) => useRandomChatStore.getState().setRequestState(pending));
  socket.on('random:pending-request', () => useRandomChatStore.getState().setPendingRequest());
  socket.on('random:friend-added', ({ conversationId }) => useRandomChatStore.getState().setConversationId(conversationId));
}

export function nextRandomChat() {
  useRandomChatStore.getState().resetForNext();
  socket?.emit('random:next');
}

export function sendRandomMessage(text) {
  socket?.emit('random:message', { text });
  useRandomChatStore.getState().addOwnMessage(text);
}

export function sendRandomFriendRequest() {
  socket?.emit('random:send-request');
}

// Ends the current pairing but keeps the socket alive — the widget shows a
// shared "chat ended" screen (matching what the partner sees on their side)
// with the option to start a new chat, rather than closing the popup outright.
export function endRandomChat() {
  socket?.emit('random:leave');
  useRandomChatStore.getState().chatEnded('self');
}

// Fully closes the random-chat session/popup, e.g. from the "ended" screen.
export function closeRandomChat() {
  socket?.emit('random:leave');
  socket?.disconnect();
  socket = null;
  useRandomChatStore.getState().endSession();
}
