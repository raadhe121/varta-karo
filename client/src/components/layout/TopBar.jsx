import Avatar from '../common/Avatar';
import { usePresenceStore } from '../../store/presenceStore';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import { startCall } from '../../call/webrtc';

function otherParticipant(conversation, myId) {
  return conversation.participants.find((p) => p.id !== myId);
}

function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return 'offline';
  const diffMin = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 60000);
  if (diffMin < 1) return 'last seen just now';
  if (diffMin < 60) return `last seen ${diffMin}m ago`;
  return `last seen ${Math.floor(diffMin / 60)}h ago`;
}

export default function TopBar({ conversation, onBack, onToggleInfo, infoOpen }) {
  const myId = useAuthStore((s) => s.user?.id);
  const presence = usePresenceStore((s) => s.byUserId);
  const callPhase = useCallStore((s) => s.phase);

  if (!conversation) return null;

  const isGroup = conversation.type === 'group';
  const displayUser = isGroup ? null : otherParticipant(conversation, myId);
  const title = isGroup ? conversation.name : displayUser?.name;
  const avatarUser = isGroup ? { name: conversation.name, avatarColor: '#6b6255' } : displayUser;
  const isOnline = !isGroup && !conversation.messagingDisabled && presence[displayUser?.id]?.status === 'online';
  const status = isGroup
    ? `${conversation.participants.length} members`
    : conversation.messagingDisabled
      ? ''
      : isOnline
        ? 'Online'
        : formatLastSeen(presence[displayUser?.id]?.lastSeenAt);

  const canCall = !isGroup && callPhase === 'idle' && !conversation.messagingDisabled;
  const callTitle = isGroup
    ? 'Group calls are not supported yet'
    : conversation.messagingDisabled
      ? 'Calling is unavailable in this conversation'
      : callPhase !== 'idle'
        ? 'Already in a call'
        : undefined;

  const call = (callType) => {
    if (!canCall) return;
    startCall({ toUserId: displayUser.id, conversationId: conversation.id, callType, remoteUser: displayUser });
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-paper">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="md:hidden h-9 w-9 -ml-1 rounded-full flex items-center justify-center hover:bg-paper-soft text-ink-soft">
            &larr;
          </button>
        )}
        <Avatar user={avatarUser} />
        <div>
          <p className="font-display font-semibold">{title}</p>
          <p className="text-xs text-ink-soft flex items-center gap-1.5">
            {isOnline && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
            {status}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-ink-soft">
        <button
          onClick={() => call('audio')}
          disabled={!canCall}
          title={callTitle || 'Voice call'}
          className={`h-9 w-9 rounded-full flex items-center justify-center ${canCall ? 'hover:bg-paper-soft' : 'opacity-40 cursor-not-allowed'}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.1 0-2.2-.2-3.1-.6L4 20l1.1-4.4C4.4 14.5 4 13.3 4 12Z"
            />
          </svg>
        </button>
        <button
          onClick={() => call('video')}
          disabled={!canCall}
          title={callTitle || 'Video call'}
          className={`h-9 w-9 rounded-full flex items-center justify-center ${canCall ? 'hover:bg-paper-soft' : 'opacity-40 cursor-not-allowed'}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="6" width="14" height="12" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="m16 10 6-3.5v11L16 14" />
          </svg>
        </button>
        {onToggleInfo && (
          <button
            onClick={onToggleInfo}
            title="Conversation info"
            className={`h-9 w-9 rounded-full flex items-center justify-center ${infoOpen ? 'bg-accent-soft text-accent' : 'hover:bg-paper-soft'}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 11v5.5" />
              <circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
