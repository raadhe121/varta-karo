import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { fetchProfile } from '../../api/social.api';
import { blockUser, unblockUser } from '../../api/block.api';
import { setConversationMuted, setConversationDisappearing } from '../../api/chat.api';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import { startCall } from '../../call/webrtc';
import { resolveMediaUrl } from '../../utils/media';

const EMPTY_MESSAGES = [];
const DISAPPEARING_ON_SECONDS = 86400; // 24h — the one duration this toggle offers

function Checkbox({ label, sublabel, on, onToggle, disabled }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className="w-full flex items-center justify-between py-2.5 text-left disabled:opacity-50"
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {sublabel && <span className="block text-xs text-ink-soft">{sublabel}</span>}
      </span>
      <span
        className={`h-5 w-5 rounded-md border-2 shrink-0 flex items-center justify-center text-[10px] ${
          on ? 'bg-accent border-accent text-white' : 'border-line'
        }`}
      >
        {on && '✓'}
      </span>
    </button>
  );
}

function IconAction({ onClick, disabled, title, label, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border border-line text-sm font-medium ${
        disabled ? 'text-ink-soft opacity-50 cursor-not-allowed' : 'text-ink hover:bg-paper-soft'
      }`}
    >
      {children}
      {label}
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
  const updateConversationMeta = useChatStore((s) => s.updateConversationMeta);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [muteLoading, setMuteLoading] = useState(false);
  const [disappearingLoading, setDisappearingLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const callPhase = useCallStore((s) => s.phase);

  const other = conversation.type === 'direct' ? conversation.participants.find((p) => p.id !== myId) : null;
  const iBlocked = Boolean(conversation.iBlocked);
  const blockedByOther = Boolean(conversation.blockedByOther);
  const canCall = callPhase === 'idle' && !conversation.messagingDisabled;

  const call = (callType) => {
    if (!canCall || !other) return;
    startCall({ toUserId: other.id, conversationId: conversation.id, callType, remoteUser: other });
  };

  useEffect(() => {
    // Their identity is already hidden in `other` when they've blocked us —
    // fetching their real profile would defeat that, so skip it.
    if (other && !blockedByOther) fetchProfile(other.id).then(setProfile);
    else setProfile(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [other?.id, blockedByOther]);

  const sharedImages = messages.filter((m) => m.type === 'image' && m.mediaUrl);

  const toggleMute = async () => {
    setMuteLoading(true);
    try {
      const { muted } = await setConversationMuted(conversation.id, !conversation.muted);
      updateConversationMeta(conversation.id, { muted });
    } finally {
      setMuteLoading(false);
    }
  };

  const toggleDisappearing = async () => {
    setDisappearingLoading(true);
    try {
      const nextSeconds = conversation.disappearingSeconds ? null : DISAPPEARING_ON_SECONDS;
      const { disappearingSeconds } = await setConversationDisappearing(conversation.id, nextSeconds);
      updateConversationMeta(conversation.id, { disappearingSeconds });
    } finally {
      setDisappearingLoading(false);
    }
  };

  const toggleBlock = async () => {
    if (!other) return;
    setBlockLoading(true);
    try {
      if (iBlocked) {
        await unblockUser(other.id);
        updateConversationMeta(conversation.id, { iBlocked: false, messagingDisabled: blockedByOther });
        fetchProfile(other.id).then(setProfile);
      } else {
        await blockUser(other.id);
        updateConversationMeta(conversation.id, { iBlocked: true, messagingDisabled: true });
      }
    } finally {
      setBlockLoading(false);
    }
  };

  if (conversation.type !== 'direct') {
    return (
      <aside className="hidden lg:block w-80 shrink-0 border-l border-line bg-paper overflow-y-auto">
        <GroupInfo conversation={conversation} />
      </aside>
    );
  }

  if (!other) return null;

  return (
    <aside className="hidden lg:block w-80 shrink-0 border-l border-line bg-paper overflow-y-auto">
      <div className="p-5">
        <div className="flex flex-col items-center text-center">
          <Avatar user={other} size="lg" />
          <Link to={`/profile/${other.id}`} className="font-display text-lg font-semibold mt-3 hover:underline">
            {other.name}
          </Link>
          <p className="text-sm text-ink-soft mt-0.5">
            @{other.username}
            {profile && (
              <>
                {' '}
                &middot; <strong className="text-ink">{profile.followerCount}</strong> follower
                {profile.followerCount === 1 ? '' : 's'} &middot; <strong className="text-ink">{profile.followingCount}</strong>{' '}
                following
              </>
            )}
          </p>
          {other.bio && <p className="text-sm mt-2">{other.bio}</p>}
        </div>

        {iBlocked && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-center">
            <p className="text-xs text-red-700 font-medium">You've blocked this person. They can't message or call you.</p>
          </div>
        )}
        {!iBlocked && blockedByOther && (
          <div className="mt-4 rounded-xl bg-paper-soft border border-line p-3 text-center">
            <p className="text-xs text-ink-soft">You can't message or call this person right now.</p>
          </div>
        )}

        <div className="flex gap-2 mt-5">
          <IconAction onClick={() => call('audio')} disabled={!canCall} title={canCall ? 'Start a voice call' : 'Unavailable'} label="Audio">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.1 0-2.2-.2-3.1-.6L4 20l1.1-4.4C4.4 14.5 4 13.3 4 12Z"
              />
            </svg>
          </IconAction>
          <IconAction onClick={() => call('video')} disabled={!canCall} title={canCall ? 'Start a video call' : 'Unavailable'} label="Video">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="14" height="12" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m16 10 6-3.5v11L16 14" />
            </svg>
          </IconAction>
          <IconAction onClick={() => navigate(`/profile/${other.id}`)} label="Profile">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="3.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
            </svg>
          </IconAction>
        </div>

        <div className="mt-5 pt-4 border-t border-line">
          <p className="text-sm font-semibold mb-2">Shared media</p>
          {sharedImages.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-line p-4 text-center">
              <p className="text-xs text-ink-soft">Photos and videos you share will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {sharedImages.slice(-9).map((m) => (
                <img key={m.id} src={resolveMediaUrl(m.mediaUrl)} alt="" className="aspect-square rounded-lg object-cover" />
              ))}
            </div>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-line divide-y divide-line">
          <Checkbox
            label="Disappearing messages"
            sublabel="Messages vanish after 24 hours"
            on={Boolean(conversation.disappearingSeconds)}
            onToggle={toggleDisappearing}
            disabled={disappearingLoading}
          />
          <Checkbox label="Mute notifications" on={Boolean(conversation.muted)} onToggle={toggleMute} disabled={muteLoading} />
        </div>

        <div className="mt-3 pt-3 border-t border-line space-y-3">
          <button disabled title="Coming soon" className="flex items-center gap-2 text-sm font-medium text-ink-soft opacity-60 cursor-not-allowed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v18M5 4h11l-2 4 2 4H5" />
            </svg>
            Report
          </button>
          <button
            onClick={toggleBlock}
            disabled={blockLoading}
            className="flex items-center gap-2 text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="m5.5 5.5 13 13" />
            </svg>
            {iBlocked ? `Unblock ${other.name}` : `Block ${other.name}`}
          </button>
        </div>
      </div>
    </aside>
  );
}
