import { useEffect, useState } from 'react';
import { fetchCallLog } from '../../api/calls.api';
import { startCall } from '../../call/webrtc';
import { useCallStore } from '../../store/callStore';
import Avatar from '../common/Avatar';

const STATUS_LABEL = {
  answered: 'Answered',
  missed: 'Missed',
  declined: 'Declined',
  no_answer: 'No answer',
};

function timeAgo(dateStr) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function CallHistoryList({ onSelectConversation }) {
  const [calls, setCalls] = useState(null);
  const callPhase = useCallStore((s) => s.phase);

  useEffect(() => {
    fetchCallLog().then(setCalls);
  }, []);

  const callBack = (call, callType) => {
    if (callPhase !== 'idle') return;
    startCall({ toUserId: call.otherUser.id, conversationId: call.conversationId, callType, remoteUser: call.otherUser });
  };

  if (calls === null) {
    return <p className="text-sm text-ink-soft px-3 py-6 text-center">Loading...</p>;
  }
  if (calls.length === 0) {
    return <p className="text-sm text-ink-soft px-3 py-6 text-center">No call history yet.</p>;
  }

  return (
    <div className="space-y-1">
      {calls.map((call) => {
        const missed = call.direction === 'incoming' && (call.status === 'missed' || call.status === 'no_answer');
        return (
          <button
            key={call.id}
            onClick={() => onSelectConversation(call.conversationId)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-paper-soft text-left"
          >
            <Avatar user={call.otherUser} size="sm" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${missed ? 'text-red-600' : ''}`}>{call.otherUser?.name}</p>
              <p className="text-xs text-ink-soft">
                {call.direction === 'outgoing' ? '↗' : '↙'} {STATUS_LABEL[call.status]} &middot; {timeAgo(call.createdAt)}
              </p>
            </div>
            <span
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                callBack(call, call.type);
              }}
              className="h-8 w-8 rounded-full flex items-center justify-center text-ink-soft hover:bg-line shrink-0"
              title={`Call back (${call.type})`}
            >
              {call.type === 'video' ? '🎥' : '📞'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
