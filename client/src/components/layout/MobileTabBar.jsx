import { NavLink } from 'react-router-dom';

const ITEMS = [
  {
    to: '/feed',
    label: 'Home',
    end: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 11.5 12 4l8 7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
      </svg>
    ),
  },
  {
    to: '/reels',
    label: 'Reels',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.1 0-2.2-.2-3.1-.6L4 20l1.1-4.4C4.4 14.5 4 13.3 4 12Z"
        />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    end: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      </svg>
    ),
  },
];

export default function MobileTabBar({ onCreate }) {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 flex items-center justify-around border-t border-line bg-paper px-2 py-1.5">
      {ITEMS.slice(0, 2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-medium ${
              isActive ? 'text-accent' : 'text-ink-soft'
            }`
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}

      <button
        onClick={onCreate}
        className="h-11 w-11 rounded-full bg-accent text-white flex items-center justify-center -mt-1"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {ITEMS.slice(2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-medium ${
              isActive ? 'text-accent' : 'text-ink-soft'
            }`
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
