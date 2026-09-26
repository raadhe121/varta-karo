import { NavLink } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';

const ITEMS = [
  {
    to: '/feed',
    label: 'Home',
    end: true,
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 11.5 12 4l8 7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
  {
    to: '/reels',
    label: 'Reels',
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
        <path strokeLinecap="round" d="M7 4 4.5 8M13.5 4 11 8M20 4l-2.5 4" />
      </svg>
    ),
  },
  {
    to: '/chat',
    label: 'Messages',
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.1 0-2.2-.2-3.1-.6L4 20l1.1-4.4C4.4 14.5 4 13.3 4 12Z"
        />
      </svg>
    ),
  },
  {
    to: '/search',
    label: 'Friends',
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="8" r="3.2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8.5a3 3 0 1 1 3.6 2.9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 20c0-2.6-1.8-4.8-4.2-5.5" />
      </svg>
    ),
  },
  {
    to: '/notifications',
    label: 'Notifications',
    badge: true,
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9a6 6 0 1 1 12 0c0 3.5 1 5 1.5 6H4.5C5 14 6 12.5 6 9Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 17.5a2.5 2.5 0 0 0 5 0" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    end: true,
    icon: (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      </svg>
    ),
  },
];

export default function FeedSidebar() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 w-64 flex-col justify-between py-4 px-3 overflow-y-auto z-10">
      <nav className="space-y-1">
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] font-medium transition-colors ${
                isActive ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-paper-soft'
              }`
            }
          >
            {item.icon}
            {item.label}
            {item.badge && unreadCount > 0 && (
              <span className="ml-auto h-5 min-w-5 px-1.5 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[15px] font-medium transition-colors ${
            isActive ? 'bg-accent-soft text-accent' : 'text-ink-soft hover:bg-paper-soft'
          }`
        }
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h13M21 18h-3" />
          <circle cx="15" cy="6" r="2" />
          <circle cx="8" cy="12" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
        Settings
      </NavLink>
    </aside>
  );
}
