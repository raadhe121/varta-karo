import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';

const ACTIONS = [
  {
    label: 'Photo',
    color: 'text-emerald-600',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10.5" r="1.6" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m5 17 5-4.5 3.5 3L18 11l3 3" />
      </svg>
    ),
  },
  {
    label: 'Video',
    color: 'text-amber-600',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="6" width="13" height="12" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m16 10.5 5-3v9l-5-3" />
      </svg>
    ),
  },
  {
    label: 'Reel',
    color: 'text-accent',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

export default function HomeComposerBar({ onOpen }) {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="rounded-2xl bg-paper border border-line p-4 space-y-3">
      <button onClick={onOpen} className="w-full flex items-center gap-3 text-left">
        <Avatar user={user} size="sm" />
        <span className="flex-1 rounded-full bg-page border border-line px-4 py-2.5 text-sm text-ink-soft">
          What&apos;s on your mind, {user?.name?.split(' ')[0] || 'there'}?
        </span>
      </button>

      <div className="flex items-center gap-2 pl-11">
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={onOpen}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-paper-soft transition-colors ${a.color}`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
