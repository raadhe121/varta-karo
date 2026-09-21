import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { fetchSuggestions, followUser } from '../../api/social.api';
import Avatar from '../common/Avatar';

export default function SuggestionsSidebar() {
  const user = useAuthStore((s) => s.user);
  const [people, setPeople] = useState(null);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    fetchSuggestions().then(setPeople);
  }, []);

  const follow = async (id) => {
    setFollowing((prev) => ({ ...prev, [id]: true }));
    try {
      await followUser(id);
    } catch {
      setFollowing((prev) => ({ ...prev, [id]: false }));
    }
  };

  const visiblePeople = (people || []).filter((p) => !following[p.id]);

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
        {people === null ? (
          <p className="text-xs text-ink-soft">Loading...</p>
        ) : visiblePeople.length === 0 ? (
          <p className="text-xs text-ink-soft">No suggestions right now.</p>
        ) : (
          <div className="space-y-3.5">
            {visiblePeople.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <Link to={`/profile/${p.id}`}>
                  <Avatar user={p} size="sm" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/profile/${p.id}`} className="text-sm font-medium truncate block hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-xs text-ink-soft truncate">{p.note}</p>
                </div>
                <button
                  onClick={() => follow(p.id)}
                  className="text-xs font-semibold shrink-0 px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors"
                >
                  Follow
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
