import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';

// UI-only mock data — there's no "discover users" endpoint on the backend
// yet, so this panel is presentational rather than wired to real
// recommendations.
const MOCK_PEOPLE = [
  { id: 's1', name: 'Tery Lucas', note: 'New to VartaKaro' },
  { id: 's2', name: 'Laura Matthews', note: 'Friends with 2 people you know' },
  { id: 's3', name: 'Harry Prescott', note: 'Friends with 3 people you know' },
  { id: 's4', name: 'Edna Manz', note: 'New to VartaKaro' },
  { id: 's5', name: 'Christina Sterling', note: 'Friends with 1 person you know' },
];

export default function SuggestionsSidebar() {
  const user = useAuthStore((s) => s.user);
  const [following, setFollowing] = useState({});

  const toggle = (id) => setFollowing((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="rounded-xl bg-paper border border-line p-4 space-y-5">
      <Link to="/profile" className="flex items-center gap-3">
        <Avatar user={user} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{user?.name || 'You'}</p>
          <p className="text-xs text-ink-soft truncate">@{user?.username}</p>
        </div>
      </Link>

      <div>
        <p className="text-sm font-semibold mb-3">People You May Know</p>
        <div className="space-y-3.5">
          {MOCK_PEOPLE.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <Avatar user={s} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{s.name}</p>
                <p className="text-xs text-ink-soft truncate">{s.note}</p>
              </div>
              <button
                onClick={() => toggle(s.id)}
                className={`text-xs font-semibold shrink-0 px-3 py-1.5 rounded-lg transition-colors ${
                  following[s.id] ? 'bg-page text-ink-soft' : 'bg-accent text-white hover:bg-accent/90'
                }`}
              >
                {following[s.id] ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
