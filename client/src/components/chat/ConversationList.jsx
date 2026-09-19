import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import ConversationItem from './ConversationItem';

export default function ConversationList({ onSelect, filter = 'all' }) {
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const myId = useAuthStore((s) => s.user?.id);

  const filtered = conversations.filter((c) => {
    if (filter === 'groups') return c.type === 'group';
    if (filter === 'unread') return c.lastMessage && c.lastMessage.senderId !== myId;
    return true;
  });

  if (filtered.length === 0) {
    return (
      <p className="text-sm text-ink-soft px-3 py-6 text-center">
        {filter === 'unread'
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
