import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { fetchUnreadCount } from '../../api/notifications.api';
import Avatar from '../common/Avatar';

export default function HomeTopBar({
  onCreate,
  showCreate = true,
  searchPlaceholder = 'Search people, posts and reels',
  searchValue,
  onSearchChange,
}) {
  const controlled = searchValue !== undefined;
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  useEffect(() => {
    fetchUnreadCount().then(({ count }) => setUnreadCount(count));
  }, [setUnreadCount]);

  return (
    <nav className="flex items-center gap-4 px-6 py-3 border-b border-line bg-paper">
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M36,22 L72,22 Q86,22 86,36 L86,66 L66,86 L36,86 Q22,86 22,72 L22,36 Q22,22 36,22 Z" fill="#ffffff" />
          </svg>
        </div>
        <p className="font-display font-bold text-lg select-none">VartaKaro</p>
      </div>

      {controlled ? (
        <div className="hidden lg:flex flex-1 max-w-md items-center gap-2 rounded-full border border-line focus-within:border-accent bg-page pl-4 pr-3 py-2 text-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink-soft">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            className="flex-1 bg-transparent outline-none"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchValue && (
            <button onClick={() => onSearchChange('')} className="text-ink-soft hover:text-ink shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => navigate('/search')}
          className="hidden lg:flex flex-1 max-w-md items-center gap-2 rounded-full border border-line bg-page pl-4 pr-4 py-2 text-sm text-ink-soft hover:border-accent transition-colors text-left"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          {searchPlaceholder}
        </button>
      )}

      <div className="flex items-center gap-3 ml-auto shrink-0">
        <button
          onClick={() => navigate('/search')}
          title="Search"
          className="lg:hidden h-9 w-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-paper-soft transition-colors"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
        </button>

        {showCreate && (
          <button
            onClick={onCreate}
            className="hidden lg:flex items-center gap-1.5 rounded-full bg-accent text-white text-sm font-semibold px-4 py-2 hover:brightness-105 transition-[filter]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            Create
          </button>
        )}

        <button
          onClick={() => navigate('/notifications')}
          title="Notifications"
          className="relative h-9 w-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-paper-soft transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9a6 6 0 1 1 12 0c0 3.5 1 5 1.5 6H4.5C5 14 6 12.5 6 9Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 17.5a2.5 2.5 0 0 0 5 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button onClick={() => navigate('/profile')} title="Your profile" className="hidden lg:block">
          <Avatar user={user} size="sm" />
        </button>
      </div>
    </nav>
  );
}
