import { useEffect, useRef, useState } from 'react';
import { fetchMessages } from '../../api/chat.api';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { getSocket } from '../../socket/socket';
import Avatar from '../common/Avatar';
import MessageBubble from './MessageBubble';
import Spinner from '../common/Spinner';

const EMPTY_MESSAGES = [];

function EmptyConversation({ otherName, otherUser, onSendHi }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
      <Avatar user={otherUser} size="lg" />
      <p className="font-display text-xl font-semibold mt-4">Start your conversation with {otherName}</p>
      <p className="text-sm text-ink-soft mt-1">You follow each other. Send a message to say hi.</p>
      <button
        onClick={onSendHi}
        className="mt-4 flex items-center gap-2 rounded-full bg-paper-soft hover:bg-line text-sm font-semibold px-4 py-2.5"
      >
        &#x1f44b; Send &ldquo;Hi {otherName}!&rdquo;
      </button>
    </div>
  );
}

export default function MessageList({ conversationId, isGroup, otherUser }) {
  const messages = useChatStore((s) => s.messagesByConversation[conversationId] || EMPTY_MESSAGES);
  const setMessages = useChatStore((s) => s.setMessages);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const addMessage = useChatStore((s) => s.addMessage);
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

  const sendHi = () => {
    const socket = getSocket();
    if (!socket || !otherUser) return;
    socket.emit('message:send', { conversationId, type: 'text', content: `Hi ${otherUser.name}!` }, (res) => {
      if (res?.message) addMessage(conversationId, res.message);
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col">
      <div className="flex items-center gap-2 justify-center text-center text-ink-soft text-xs rounded-full bg-paper-soft px-4 py-2 mb-3 mx-auto">
        &#128274; Only you {isGroup ? 'and the group' : otherUser ? `and ${otherUser.name}` : 'and this conversation'} can see this
        conversation
      </div>
      {hasMore && (
        <div className="flex justify-center mb-3">
          <button onClick={loadMore} disabled={loadingMore} className="text-xs text-accent hover:underline">
            {loadingMore ? 'Loading...' : 'Load earlier messages'}
          </button>
        </div>
      )}
      {messages.length === 0 && !isGroup && otherUser ? (
        <EmptyConversation otherName={otherUser.name} otherUser={otherUser} onSendHi={sendHi} />
      ) : (
        messages.map((m, i) => (
          <MessageBubble key={m.id} message={m} showSender={isGroup && messages[i - 1]?.senderId !== m.senderId} />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
