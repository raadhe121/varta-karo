import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import ConversationItem from './ConversationItem';

function conversationLabel(conversation, myId) {
  if (conversation.type === 'group') return conversation.name || '';
  return conversation.participants.find((p) => p.id !== myId)?.name || '';
}

export default function ConversationList({ onSelect, filter = 'all', search = '' }) {
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const myId = useAuthStore((s) => s.user?.id);

  const query = search.trim().toLowerCase();

  const filtered = conversations.filter((c) => {
    if (filter === 'groups' && c.type !== 'group') return false;
    if (filter === 'unread' && !(c.lastMessage && c.lastMessage.senderId !== myId)) return false;
    if (query && !conversationLabel(c, myId).toLowerCase().includes(query)) return false;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-ink-soft px-3 py-6 text-center">
        {query
          ? 'No conversations match your search.'
          : filter === 'unread'
            ? 'Nothing unread.'
            : filter === 'groups'
              ? 'No groups yet.'
              : 'No chats yet. Add a contact to start one.'}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {filtered.map((c) => (
        <ConversationItem key={c.id} conversation={c} active={c.id === activeConversationId} onClick={() => onSelect(c.id)} />
      ))}
    </div>
  );
}
