import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useThemeStore } from '../../store/themeStore';
import { fetchUnreadCount } from '../../api/notifications.api';
import { useSocket } from '../../hooks/useSocket';
import Avatar from '../common/Avatar';
import IncomingCallModal from '../call/IncomingCallModal';
import ActiveCallOverlay from '../call/ActiveCallOverlay';
import CreatePostModal from '../social/CreatePostModal';

function BrandMark() {
  return (
    <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
      <svg width="16" height="16" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="14" width="64" height="64" rx="16" fill="#ffffff" fillOpacity="0.55" transform="rotate(-8 46 46)" />
        <g transform="rotate(6 54 54)">
          <path d="M36,22 L72,22 Q86,22 86,36 L86,66 L66,86 L36,86 Q22,86 22,72 L22,36 Q22,22 36,22 Z" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}

function NavIcon({ to, title, badge, children, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={title}
      className={({ isActive }) =>
        `h-9 w-9 rounded-lg flex items-center justify-center relative transition-colors ${
          isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-paper-soft'
        }`
      }
    >
      {children}
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  );
}

export default function AppNav() {
  useSocket();

  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const [composerOpen, setComposerOpen] = useState(false);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  useEffect(() => {
    fetchUnreadCount().then(({ count }) => setUnreadCount(count));
  }, [setUnreadCount]);

  return (
    <>
      <IncomingCallModal />
      <ActiveCallOverlay />
      {composerOpen && <CreatePostModal onClose={() => setComposerOpen(false)} />}
      <nav className="flex items-center gap-4 px-4 py-2.5 border-b border-line bg-paper">
        <div className="flex items-center gap-2.5 shrink-0">
          <BrandMark />
          <p className="font-display font-bold text-lg text-ink select-none">VartaKaro</p>
        </div>

        <button
          onClick={() => navigate('/search')}
          className="relative w-64 flex items-center gap-2 rounded-lg border border-line bg-page pl-3.5 pr-4 py-1.5 text-sm text-ink-soft hover:border-accent transition-colors text-left"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          Search
        </button>

        <div className="flex items-center gap-1 ml-auto shrink-0">
          <NavIcon to="/feed" title="Home">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="4" width="7" height="7" rx="1.5" />
              <rect x="13" y="4" width="7" height="7" rx="1.5" />
              <rect x="4" y="13" width="7" height="7" rx="1.5" />
              <rect x="13" y="13" width="7" height="7" rx="1.5" />
            </svg>
          </NavIcon>
          <NavIcon to="/reels" title="Reels">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
              <path strokeLinecap="round" d="M7 4 4.5 8M13.5 4 11 8M20 4l-2.5 4" />
            </svg>
          </NavIcon>
          <NavIcon to="/random-chat" title="Talk to a stranger">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 3 21 7l-4 4M21 7H9a4 4 0 0 0-4 4v1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21 3 17l4-4M3 17h12a4 4 0 0 0 4-4v-1" />
            </svg>
          </NavIcon>
          <NavIcon to="/chat" title="Chats & calls">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.1 0-2.2-.2-3.1-.6L4 20l1.1-4.4C4.4 14.5 4 13.3 4 12Z"
              />
            </svg>
          </NavIcon>
          <NavIcon to="/communities" title="Communities">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 20v-2a4 4 0 0 0-3-3.87M15 3.13a4 4 0 0 1 0 7.75"
              />
            </svg>
          </NavIcon>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-ink-soft hover:bg-paper-soft transition-colors"
          >
            {theme === 'dark' ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4.5" />
                <path
                  strokeLinecap="round"
                  d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
                />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setComposerOpen(true)}
            title="Create post"
            className="h-9 w-9 rounded-lg flex items-center justify-center text-ink-soft hover:bg-paper-soft transition-colors"
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path strokeLinecap="round" d="M12 8v8M8 12h8" />
            </svg>
          </button>
          <NavIcon to="/notifications" title="Notifications" badge={unreadCount}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 9a6 6 0 1 1 12 0c0 3.5 1 5 1.5 6H4.5C5 14 6 12.5 6 9Z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 17.5a2.5 2.5 0 0 0 5 0" />
            </svg>
          </NavIcon>
          <NavIcon to="/profile" title="Your profile" end>
            <Avatar user={user} size="sm" />
          </NavIcon>
        </div>
      </nav>
    </>
  );
}
