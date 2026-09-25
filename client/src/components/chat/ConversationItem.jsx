import Avatar from '../common/Avatar';
import { usePresenceStore } from '../../store/presenceStore';
import { useAuthStore } from '../../store/authStore';

function otherParticipant(conversation, myId) {
  return conversation.participants.find((p) => p.id !== myId);
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ConversationItem({ conversation, active, onClick }) {
  const myId = useAuthStore((s) => s.user?.id);
  const isOnline = usePresenceStore((s) => s.isOnline);

  const displayUser = conversation.type === 'direct' ? otherParticipant(conversation, myId) : null;
  const title = conversation.type === 'group' ? conversation.name : displayUser?.name || 'Unknown';
  const avatarUser =
    conversation.type === 'group'
      ? { name: conversation.name, avatarUrl: conversation.avatarUrl, avatarColor: '#6b6255' }
      : displayUser;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
        active ? 'bg-accent-soft/40' : 'hover:bg-paper-soft'
      }`}
    >
      <Avatar
        user={avatarUser}
        showStatus={conversation.type === 'direct' && !conversation.messagingDisabled}
        isOnline={isOnline(displayUser?.id)}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate">{title}</p>
          <span className="text-xs text-ink-soft shrink-0">{timeAgo(conversation.lastMessage?.createdAt)}</span>
        </div>
        <p className="text-xs text-ink-soft truncate">
          {conversation.lastMessage
            ? conversation.lastMessage.type === 'text'
              ? conversation.lastMessage.content
              : '📎 Attachment'
            : 'Say hello 👋'}
        </p>
      </div>
    </button>
  );
}
