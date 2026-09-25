import { useEffect } from 'react';
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
  resumeCall,
  handleResumeOffer,
  handleResumeAnswer,
  handlePeerReconnecting,
} from '../call/webrtc';

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket();
      return;
    }

    const socket = getSocket() || connectSocket();
    const { addMessage, removeMessage, setMessageStatus, setTyping, upsertConversation, updateConversationMeta } =
      useChatStore.getState();
    const { setPresence } = usePresenceStore.getState();
    const { addNotification } = useNotificationStore.getState();

    const onMessageNew = (message) => addMessage(message.conversationId, message);
    const onMessageDeleted = ({ conversationId, messageId }) => removeMessage(conversationId, messageId);
    const onMessageStatus = ({ conversationId, messageId, userId, status }) =>
      setMessageStatus(conversationId, messageId, userId, status);
    const onTypingUpdate = ({ conversationId, userId, isTyping }) => setTyping(conversationId, userId, isTyping);
    const onPresenceUpdate = ({ userId, status, lastSeenAt }) => setPresence(userId, status, lastSeenAt);
    const onConversationNew = (conversation) => upsertConversation(conversation);
    const onConversationDisappearing = ({ conversationId, disappearingSeconds }) =>
      updateConversationMeta(conversationId, { disappearingSeconds });
    const onNotificationNew = (notification) => addNotification(notification);

    socket.on('message:new', onMessageNew);
    socket.on('message:deleted', onMessageDeleted);
    socket.on('message:status', onMessageStatus);
    socket.on('typing:update', onTypingUpdate);
    socket.on('presence:update', onPresenceUpdate);
    socket.on('conversation:new', onConversationNew);
    socket.on('conversation:disappearing', onConversationDisappearing);
    socket.on('notification:new', onNotificationNew);
    socket.on('call:incoming', handleIncoming);
    socket.on('call:answered', handleAnswered);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:declined', handleDeclined);
    socket.on('call:ended', handleEnded);
    socket.on('call:unavailable', handleUnavailable);
    socket.on('call:cancel-ring', handleCancelRing);
    socket.on('call:resume-available', resumeCall);
    socket.on('call:resume-offer', handleResumeOffer);
    socket.on('call:resume-answer', handleResumeAnswer);
    socket.on('call:peer-reconnecting', handlePeerReconnecting);

    return () => {
      socket.off('message:new', onMessageNew);
      socket.off('message:deleted', onMessageDeleted);
      socket.off('message:status', onMessageStatus);
      socket.off('typing:update', onTypingUpdate);
      socket.off('presence:update', onPresenceUpdate);
      socket.off('conversation:new', onConversationNew);
      socket.off('conversation:disappearing', onConversationDisappearing);
      socket.off('notification:new', onNotificationNew);
      socket.off('call:incoming', handleIncoming);
      socket.off('call:answered', handleAnswered);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:declined', handleDeclined);
      socket.off('call:ended', handleEnded);
      socket.off('call:unavailable', handleUnavailable);
      socket.off('call:cancel-ring', handleCancelRing);
      socket.off('call:resume-available', resumeCall);
      socket.off('call:resume-offer', handleResumeOffer);
      socket.off('call:resume-answer', handleResumeAnswer);
      socket.off('call:peer-reconnecting', handlePeerReconnecting);
    };
  }, [accessToken]);
}
