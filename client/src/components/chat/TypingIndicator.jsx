import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

const EMPTY_TYPING = [];

export default function TypingIndicator({ conversationId }) {
  const typingUserIds = useChatStore((s) => s.typingByConversation[conversationId] || EMPTY_TYPING);
  const myId = useAuthStore((s) => s.user?.id);

  const others = typingUserIds.filter((id) => id !== myId);
  if (others.length === 0) return <div className="h-5" />;

  return <p className="h-5 px-4 text-xs text-ink-soft italic">typing...</p>;
}
