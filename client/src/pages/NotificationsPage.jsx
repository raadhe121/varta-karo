import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import IncomingCallModal from '../components/call/IncomingCallModal';
import ActiveCallOverlay from '../components/call/ActiveCallOverlay';
import HomeTopBar from '../components/layout/HomeTopBar';
import FeedSidebar from '../components/layout/FeedSidebar';
import MobileTabBar from '../components/layout/MobileTabBar';
import CreatePostModal from '../components/social/CreatePostModal';
import FollowButton from '../components/social/FollowButton';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import { fetchNotifications, markAllNotificationsRead } from '../api/notifications.api';
import { fetchFollowRequests, acceptFollowRequest, rejectFollowRequest } from '../api/social.api';
import { createConversation } from '../api/chat.api';
import { useNotificationStore } from '../store/notificationStore';
import { useChatStore } from '../store/chatStore';
import { getNotificationPrefs, setNotificationPrefs } from '../utils/notificationPrefs';

const TYPE_TEXT = {
  follow: 'started following you',
  follow_accept: 'accepted your follow request',
  like: 'liked your post',
  comment: 'commented on your post',
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'follow', label: 'Follows' },
  { id: 'like', label: 'Likes' },
  { id: 'comment', label: 'Comments' },
  { id: 'mention', label: 'Mentions' },
];

function timeAgo(dateStr) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function FollowRequestsInbox() {
  const [requests, setRequests] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    fetchFollowRequests().then(setRequests);
  }, []);

  const respond = async (requestId, accept) => {
    setBusyId(requestId);
    try {
      if (accept) {
        await acceptFollowRequest(requestId);
      } else {
        await rejectFollowRequest(requestId);
      }
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } finally {
      setBusyId(null);
    }
  };

  if (requests === null || requests.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      <p className="text-xs uppercase tracking-wide font-semibold text-ink-soft">Follow requests</p>
      {requests.map((r) => (
        <div key={r.id} className="flex items-center gap-3 rounded-2xl p-3 bg-paper border border-line">
          <Link to={`/profile/${r.requester.id}`}>
            <Avatar user={r.requester} size="sm" />
          </Link>
          <div className="flex-1 min-w-0">
            <Link to={`/profile/${r.requester.id}`} className="text-sm font-semibold hover:underline">
              {r.requester.name}
            </Link>
            <p className="text-xs text-ink-soft">wants to follow you</p>
          </div>
          <Button className="text-xs px-3 py-1.5" disabled={busyId === r.id} onClick={() => respond(r.id, true)}>
            Accept
          </Button>
          <Button
            variant="outline"
            className="text-xs px-3 py-1.5"
            disabled={busyId === r.id}
            onClick={() => respond(r.id, false)}
          >
            Decline
          </Button>
        </div>
      ))}
    </div>
  );
}

function NotifyMeRail() {
  const [prefs, setPrefs] = useState(getNotificationPrefs());

  const toggle = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setNotificationPrefs(next);
  };

  const rows = [
    { key: 'newFollowers', label: 'New followers' },
    { key: 'likes', label: 'Likes' },
    { key: 'commentsAndMentions', label: 'Comments & mentions' },
    { key: 'messages', label: 'Messages' },
  ];

  return (
    <div className="rounded-2xl bg-paper border border-line p-5">
      <p className="font-display font-semibold text-lg mb-3">Notify me about</p>
      <div className="space-y-3.5">
        {rows.map((r) => (
          <button key={r.key} onClick={() => toggle(r.key)} className="w-full flex items-center justify-between text-sm">
            <span>{r.label}</span>
            <span
              className={`h-5 w-5 rounded-md border-2 flex items-center justify-center text-[10px] ${
                prefs[r.key] ? 'bg-accent border-accent text-white' : 'border-line'
              }`}
            >
              {prefs[r.key] && '✓'}
            </span>
          </button>
        ))}
      </div>
      <Link to="/settings" className="block text-sm font-semibold text-accent mt-4 hover:underline">
        All notification settings
      </Link>
    </div>
  );
}

export default function NotificationsPage() {
  useSocket();
  const navigate = useNavigate();
  const items = useNotificationStore((s) => s.items);
  const setItems = useNotificationStore((s) => s.setItems);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const [filter, setFilter] = useState('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [messagingId, setMessagingId] = useState(null);

  useEffect(() => {
    fetchNotifications().then(setItems);
  }, [setItems]);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    markAllRead();
  };

  const messageActor = async (userId) => {
    setMessagingId(userId);
    try {
      const conversation = await createConversation({ type: 'direct', participantIds: [userId] });
      upsertConversation(conversation);
      setActiveConversation(conversation.id);
      navigate('/chat');
    } finally {
      setMessagingId(null);
    }
  };

  const visible = (items || []).filter((n) => TYPE_TEXT[n.type] && (filter === 'all' || n.type === filter));
  const unread = visible.filter((n) => !n.read);
  const earlier = visible.filter((n) => n.read);

  const renderRow = (n) => (
    <div
      key={n.id}
      className={`flex items-center gap-3 rounded-2xl p-3 ${n.read ? 'bg-paper' : 'bg-accent-soft/40'}`}
    >
      {!n.read && <span className="h-2 w-2 rounded-full bg-accent shrink-0" />}
      <Avatar user={n.actor} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold">{n.actor.name}</span> {TYPE_TEXT[n.type]}
          {n.postSummary && <span className="text-ink-soft"> &mdash; &ldquo;{n.postSummary}&rdquo;</span>}
        </p>
        <p className="text-xs text-ink-soft">{timeAgo(n.createdAt)}</p>
      </div>
      {(n.type === 'follow' || n.type === 'follow_accept') && (
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="text-xs px-3 py-1.5"
            disabled={messagingId === n.actor.id}
            onClick={() => messageActor(n.actor.id)}
          >
            Message
          </Button>
          <FollowButton profile={{ id: n.actor.id, isFollowing: n.isFollowingBack }} />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <IncomingCallModal />
      <ActiveCallOverlay />
      {composerOpen && <CreatePostModal onClose={() => setComposerOpen(false)} />}

      <HomeTopBar onCreate={() => setComposerOpen(true)} />

      <FeedSidebar />

      <div className="flex-1 flex justify-center gap-8 px-0 lg:pl-64 lg:pr-6 py-0 lg:py-6">
        <main className="flex-1 max-w-[680px] px-4 lg:px-0 py-4 lg:py-0 pb-16 lg:pb-0">
          <div className="flex items-center justify-between mb-4">
            <p className="font-display text-3xl font-bold">Notifications</p>
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 rounded-xl border border-line text-sm font-semibold px-3.5 py-2 hover:bg-paper-soft"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.5 12 4 4L15 7M9 16l1 1 9-9" />
              </svg>
              Mark all as read
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-4">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`shrink-0 text-sm font-semibold px-4 py-1.5 rounded-full whitespace-nowrap ${
                  filter === f.id ? 'bg-paper text-ink' : 'bg-paper-soft text-ink-soft hover:bg-line'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <FollowRequestsInbox />

          {items === null ? (
            <div className="flex justify-center py-8">
              <p className="text-sm text-ink-soft">Loading...</p>
            </div>
          ) : (
            <>
              {unread.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs uppercase tracking-wide font-semibold text-ink-soft">New</p>
                  {unread.map(renderRow)}
                </div>
              )}
              {earlier.length > 0 && (
                <div className="space-y-2 mb-6">
                  <p className="text-xs uppercase tracking-wide font-semibold text-ink-soft">Earlier</p>
                  {earlier.map(renderRow)}
                </div>
              )}
              {visible.length === 0 && (
                <div className="text-center py-10">
                  <div className="h-12 w-12 rounded-full bg-paper-soft text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-display font-semibold text-lg">You&apos;re all caught up</p>
                  <p className="text-sm text-ink-soft mt-1">Likes, comments and new followers will show up here.</p>
                </div>
              )}
            </>
          )}
        </main>

        <div className="hidden xl:block w-[320px] shrink-0">
          <NotifyMeRail />
        </div>
      </div>

      <MobileTabBar onCreate={() => setComposerOpen(true)} />
    </div>
  );
}
