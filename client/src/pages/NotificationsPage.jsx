import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppNav from '../components/layout/AppNav';
import Avatar from '../components/common/Avatar';
import Spinner from '../components/common/Spinner';
import { fetchNotifications, markAllNotificationsRead } from '../api/notifications.api';
import { useNotificationStore } from '../store/notificationStore';

const TYPE_TEXT = {
  follow: 'started following you',
  like: 'liked your post',
  comment: 'commented on your post',
};

const TYPE_LINK = {
  follow: (n) => `/profile/${n.actor.id}`,
  like: () => '/profile',
  comment: () => '/profile',
};

function timeAgo(dateStr) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsPage() {
  const items = useNotificationStore((s) => s.items);
  const setItems = useNotificationStore((s) => s.setItems);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  useEffect(() => {
    fetchNotifications().then(setItems);
    markAllNotificationsRead().then(markAllRead);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <div className="max-w-xl w-full mx-auto px-4 py-6">
        <p className="font-display text-2xl font-semibold mb-4">Notifications</p>

        {items === null ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : items.filter((n) => TYPE_LINK[n.type]).length === 0 ? (
          <p className="text-ink-soft text-center py-8">
            Nothing here yet. Likes, comments, and new followers will show up here.
          </p>
        ) : (
          <div className="space-y-2">
            {items
              .filter((n) => TYPE_LINK[n.type])
              .map((n) => (
                <Link
                  key={n.id}
                  to={TYPE_LINK[n.type](n)}
                  className={`flex items-center gap-3 rounded-2xl p-3 shadow-sm shadow-ink/5 transition-colors ${
                    n.read ? 'bg-paper' : 'bg-accent-soft/40'
                  }`}
                >
                  <Avatar user={n.actor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-semibold">{n.actor.name}</span> {TYPE_TEXT[n.type]}
                      {n.postSummary && <span className="text-ink-soft"> &mdash; &ldquo;{n.postSummary}&rdquo;</span>}
                    </p>
                    <p className="text-xs text-ink-soft">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-accent shrink-0" />}
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
