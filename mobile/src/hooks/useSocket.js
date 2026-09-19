import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { usePresenceStore } from '../store/presenceStore';
import { useNotificationStore } from '../store/notificationStore';
import { connectSocket, disconnectSocket, getSocket } from '../socket/socket';
import {
  handleIncoming,
  handleAnswered,
  handleIceCandidate,
  handleDeclined,
  handleEnded,
  handleUnavailable,
  handleCancelRing,
} from '../call/webrtc';

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      return;
    }

    const socket = getSocket() || connectSocket();
    const { addMessage, setMessageStatus, setTyping, upsertConversation } = useChatStore.getState();
    const { setPresence } = usePresenceStore.getState();
    const { addNotification } = useNotificationStore.getState();

    const onMessageNew = (message) => addMessage(message.conversationId, message);
    const onMessageStatus = ({ conversationId, messageId, userId, status }) =>
      setMessageStatus(conversationId, messageId, userId, status);
    const onTypingUpdate = ({ conversationId, userId, isTyping }) => setTyping(conversationId, userId, isTyping);
    const onPresenceUpdate = ({ userId, status, lastSeenAt }) => setPresence(userId, status, lastSeenAt);
    const onConversationNew = (conversation) => upsertConversation(conversation);
    const onNotificationNew = (notification) => addNotification(notification);

    socket.on('message:new', onMessageNew);
    socket.on('message:status', onMessageStatus);
    socket.on('typing:update', onTypingUpdate);
    socket.on('presence:update', onPresenceUpdate);
    socket.on('conversation:new', onConversationNew);
    socket.on('notification:new', onNotificationNew);
    socket.on('call:incoming', handleIncoming);
    socket.on('call:answered', handleAnswered);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:declined', handleDeclined);
    socket.on('call:ended', handleEnded);
    socket.on('call:unavailable', handleUnavailable);
    socket.on('call:cancel-ring', handleCancelRing);

    return () => {
      socket.off('message:new', onMessageNew);
      socket.off('message:status', onMessageStatus);
      socket.off('typing:update', onTypingUpdate);
      socket.off('presence:update', onPresenceUpdate);
      socket.off('conversation:new', onConversationNew);
      socket.off('notification:new', onNotificationNew);
      socket.off('call:incoming', handleIncoming);
      socket.off('call:answered', handleAnswered);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:declined', handleDeclined);
      socket.off('call:ended', handleEnded);
      socket.off('call:unavailable', handleUnavailable);
      socket.off('call:cancel-ring', handleCancelRing);
    };
  }, [accessToken]);

  // Backgrounding (screen lock, app switch) can leave a "zombie" WebSocket on
  // React Native: socket.connected still reads true, but the OS already tore
  // down the underlying connection, so nothing further is ever received —
  // messages sent while backgrounded silently never arrive. Forcing a fresh
  // reconnect on every return to foreground fixes that instead of waiting on
  // engine.io's ping timeout (which RN often fails to detect at all).
  useEffect(() => {
    if (!accessToken) return;

    const onAppStateChange = (state) => {
      if (state !== 'active') return;
      const socket = getSocket();
      if (!socket) return;
      socket.disconnect();
      socket.connect();
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [accessToken]);
}
