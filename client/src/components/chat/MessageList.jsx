import { useEffect, useRef, useState } from 'react';
import { fetchMessages } from '../../api/chat.api';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../socket/socket';
import MessageBubble from './MessageBubble';
import Spinner from '../common/Spinner';

const EMPTY_MESSAGES = [];

export default function MessageList({ conversationId, isGroup }) {
  const messages = useChatStore((s) => s.messagesByConversation[conversationId] || EMPTY_MESSAGES);
  const setMessages = useChatStore((s) => s.setMessages);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const myId = useAuthStore((s) => s.user?.id);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setHasMore(true);
    fetchMessages(conversationId).then((data) => {
      if (cancelled) return;
      setMessages(conversationId, data);
      setHasMore(data.length >= 30);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [conversationId, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [conversationId, messages.length]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.senderId !== myId) {
      socket.emit('message:read', { conversationId, messageId: last.id });
    }
  }, [conversationId, messages, myId]);

  const loadMore = async () => {
    if (messages.length === 0) return;
    setLoadingMore(true);
    const oldest = messages[0];
    const older = await fetchMessages(conversationId, oldest.createdAt);
    prependMessages(conversationId, older);
    setHasMore(older.length >= 30);
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
      <div className="flex items-center gap-2 justify-center text-center bg-accent-soft/50 text-ink-soft text-xs rounded-xl px-4 py-2.5 mb-3">
        🔒 Messages here are between you and this conversation's members.
      </div>
      {hasMore && (
        <div className="flex justify-center mb-3">
          <button onClick={loadMore} disabled={loadingMore} className="text-xs text-accent hover:underline">
            {loadingMore ? 'Loading...' : 'Load earlier messages'}
          </button>
        </div>
      )}
      {messages.map((m, i) => (
        <MessageBubble key={m.id} message={m} showSender={isGroup && messages[i - 1]?.senderId !== m.senderId} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
