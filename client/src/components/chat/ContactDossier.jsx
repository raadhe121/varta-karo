import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { fetchProfile } from '../../api/social.api';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import { startCall } from '../../call/webrtc';
import { resolveMediaUrl } from '../../utils/media';

const EMPTY_MESSAGES = [];

function InertToggle({ label, defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className="w-full flex items-center justify-between py-2.5 text-sm text-left"
    >
      <span>{label}</span>
      <span className={`h-5 w-9 rounded-full transition-colors relative ${on ? 'bg-accent' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-paper transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}

function GroupInfo({ conversation }) {
  return (
    <div className="p-5">
      <div className="flex flex-col items-center text-center mb-4">
        <Avatar user={{ name: conversation.name, avatarColor: '#8A7D6C' }} size="lg" />
        <p className="font-display text-lg font-semibold mt-3">{conversation.name}</p>
        <p className="text-sm text-ink-soft">{conversation.participants.length} members</p>
      </div>
      <p className="text-xs uppercase tracking-wide text-ink-soft mb-2">Members</p>
      <div className="space-y-2">
        {conversation.participants.map((p) => (
          <Link key={p.id} to={`/profile/${p.id}`} className="flex items-center gap-2 hover:bg-paper-soft rounded-lg px-1.5 py-1">
            <Avatar user={p} size="sm" />
            <span className="text-sm">{p.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function ContactDossier({ conversation }) {
  const myId = useAuthStore((s) => s.user?.id);
  const messages = useChatStore((s) => s.messagesByConversation[conversation.id] || EMPTY_MESSAGES);
  const [profile, setProfile] = useState(null);
  const callPhase = useCallStore((s) => s.phase);

  const other = conversation.type === 'direct' ? conversation.participants.find((p) => p.id !== myId) : null;
  const canCall = callPhase === 'idle';

  const call = (callType) => {
    if (!canCall || !other) return;
    startCall({ toUserId: other.id, conversationId: conversation.id, callType, remoteUser: other });
  };

  useEffect(() => {
    if (other) fetchProfile(other.id).then(setProfile);
  }, [other?.id]);

  const sharedImages = messages.filter((m) => m.type === 'image' && m.mediaUrl);

  if (conversation.type !== 'direct') {
    return (
      <aside className="w-80 shrink-0 border-l border-line bg-paper overflow-y-auto">
        <GroupInfo conversation={conversation} />
      </aside>
    );
  }

  if (!other) return null;

  return (
    <aside className="w-80 shrink-0 border-l border-line bg-paper overflow-y-auto">
      <div className="p-5">
        <p className="text-xs uppercase tracking-wide text-ink-soft mb-4">Contact Dossier</p>

        <div className="flex flex-col items-center text-center">
          <Avatar user={other} size="lg" />
          <Link to={`/profile/${other.id}`} className="font-display text-lg font-semibold mt-3 hover:underline">
            {other.name}
          </Link>
          <p className="text-sm text-ink-soft">@{other.username}</p>
          {other.bio && <p className="text-sm mt-2">{other.bio}</p>}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={() => call('audio')}
            disabled={!canCall}
            title={canCall ? 'Start a voice call' : 'Already in a call'}
            className={`flex-1 py-2 rounded-xl border border-line text-sm font-medium ${canCall ? 'text-ink hover:bg-paper-soft' : 'text-ink-soft opacity-50 cursor-not-allowed'}`}
          >
            📞 Audio
          </button>
          <button
            onClick={() => call('video')}
            disabled={!canCall}
            title={canCall ? 'Start a video call' : 'Already in a call'}
            className={`flex-1 py-2 rounded-xl border border-line text-sm font-medium ${canCall ? 'text-ink hover:bg-paper-soft' : 'text-ink-soft opacity-50 cursor-not-allowed'}`}
          >
            🎥 Video
          </button>
        </div>

        {profile && (
          <div className="flex gap-4 justify-center text-sm text-ink-soft mt-4">
            <span>
              <strong className="text-ink">{profile.friendCount}</strong> friends
            </span>
            <span>
              <strong className="text-ink">{profile.followerCount}</strong> followers
            </span>
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-line">
          <p className="text-xs uppercase tracking-wide text-ink-soft mb-2">Shared photos ({sharedImages.length})</p>
          {sharedImages.length === 0 ? (
            <p className="text-sm text-ink-soft">No photos shared yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {sharedImages.slice(-9).map((m) => (
                <img key={m.id} src={resolveMediaUrl(m.mediaUrl)} alt="" className="aspect-square rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-line divide-y divide-line">
          <InertToggle label="Disappearing messages" />
          <InertToggle label="Mute notifications" />
        </div>

        <button
          disabled
          title="Coming soon"
          className="mt-3 text-sm text-red-600/60 cursor-not-allowed"
        >
          Block {other.name}
        </button>
      </div>
    </aside>
  );
}
