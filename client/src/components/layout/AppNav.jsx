import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { searchUsers } from '../../api/contacts.api';
import { fetchUnreadCount } from '../../api/notifications.api';
import { useSocket } from '../../hooks/useSocket';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import IncomingCallModal from '../call/IncomingCallModal';
import ActiveCallOverlay from '../call/ActiveCallOverlay';

const LINK_BASE = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors';

function BrandMark() {
  return (
    <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
      <svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="14" width="64" height="64" rx="16" fill="#ffffff" fillOpacity="0.55" transform="rotate(-8 46 46)" />
        <g transform="rotate(6 54 54)">
          <path
            d="M36,22 L72,22 Q86,22 86,36 L86,66 L66,86 L36,86 Q22,86 22,72 L22,36 Q22,22 36,22 Z"
            fill="#ffffff"
          />
        </g>
      </svg>
    </div>
  );
}

export default function AppNav() {
  useSocket();

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  useEffect(() => {
    fetchUnreadCount().then(({ count }) => setUnreadCount(count));
  }, [setUnreadCount]);

  const runSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setResults(await searchUsers(q));
  };

  const goToProfile = (id) => {
    setQuery('');
    setResults([]);
    navigate(`/profile/${id}`);
  };

  return (
    <>
      <IncomingCallModal />
      <ActiveCallOverlay />
      <nav className="flex items-center gap-4 px-4 py-2.5 border-b border-line bg-paper">
      <div className="flex items-center gap-2.5 shrink-0">
        <BrandMark />
        <div className="leading-tight">
          <p className="font-display font-bold text-base text-ink">VartaKaro</p>
          <p className="text-[11px] text-ink-soft">Stories &amp; Conversations</p>
        </div>
      </div>

      <div className="relative flex-1 max-w-md">
        <input
          className="w-full rounded-full border border-line bg-page px-4 py-2 text-sm outline-none focus:border-accent"
          placeholder="Search people..."
          value={query}
          onChange={(e) => runSearch(e.target.value)}
        />
        {results.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-paper rounded-xl shadow-lg border border-line overflow-hidden z-20">
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => goToProfile(u.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-paper-soft text-left"
              >
                <Avatar user={u} size="sm" />
                <span className="text-sm font-medium">{u.name}</span>
                <span className="text-xs text-ink-soft">@{u.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <NavLink to="/feed" className={({ isActive }) => `${LINK_BASE} ${isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-paper-soft'}`}>
          Feed &amp; Stories
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => `${LINK_BASE} ${isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-paper-soft'}`}>
          Chats &amp; Calls
        </NavLink>
        <NavLink to="/communities" className={({ isActive }) => `${LINK_BASE} ${isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-paper-soft'}`}>
          Communities
        </NavLink>
        <NavLink
          to="/notifications"
          className={({ isActive }) => `${LINK_BASE} relative ${isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-paper-soft'}`}
        >
          Notifications
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NavLink>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Button className="text-sm px-4" onClick={() => navigate('/feed')}>
          + New Post
        </Button>
        <NavLink to="/profile" end>
          <Avatar user={user} size="sm" />
        </NavLink>
      </div>
      </nav>
    </>
  );
}
