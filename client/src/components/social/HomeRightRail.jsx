import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { fetchSuggestions, followUser } from '../../api/social.api';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

function SuggestionRow({ person, onFollowed }) {
  const [following, setFollowing] = useState(false);

  const follow = async () => {
    setFollowing(true);
    try {
      await followUser(person.id);
      onFollowed(person.id);
    } catch {
      setFollowing(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Link to={`/profile/${person.id}`}>
        <Avatar user={person} size="sm" />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/profile/${person.id}`} className="text-sm font-medium truncate block hover:underline">
          {person.name}
        </Link>
        <p className="text-xs text-ink-soft truncate">{person.note}</p>
      </div>
      <Button className="text-xs px-3 py-1.5 shrink-0" disabled={following} onClick={follow}>
        Follow
      </Button>
    </div>
  );
}

export default function HomeRightRail() {
  const user = useAuthStore((s) => s.user);
  const [people, setPeople] = useState(null);

  useEffect(() => {
    fetchSuggestions().then(setPeople);
  }, []);

  const visiblePeople = (people || []).filter((p) => !p._followed);
  const dismiss = (id) => setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, _followed: true } : p)));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-paper border border-line p-4 flex items-center justify-between">
        <Link to="/profile" className="flex items-center gap-3 min-w-0">
          <Avatar user={user} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user?.name}</p>
            <p className="text-xs text-ink-soft truncate">@{user?.username}</p>
          </div>
        </Link>
        <Link to="/profile" className="text-xs font-semibold text-accent shrink-0">
          View profile
        </Link>
      </div>

      <div className="rounded-2xl bg-paper border border-line p-4">
        <p className="text-sm font-semibold mb-4">People you may know</p>

        {people === null ? (
          <p className="text-xs text-ink-soft">Loading...</p>
        ) : visiblePeople.length === 0 ? (
          <div className="text-center py-4">
            <div className="h-12 w-12 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="8" r="3.2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                <path strokeLinecap="round" d="M17 8v5M14.5 10.5h5" />
              </svg>
            </div>
            <p className="text-sm font-semibold">No suggestions yet</p>
            <p className="text-xs text-ink-soft mt-1">Invite friends or find people you know to fill your feed.</p>
            <div className="flex gap-2 mt-3">
              <Button className="text-xs flex-1" disabled title="Coming soon">
                Invite friends
              </Button>
              <Link to="/search" className="flex-1">
                <Button variant="outline" className="text-xs w-full">
                  Find people
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {visiblePeople.map((p) => (
              <SuggestionRow key={p.id} person={p} onFollowed={dismiss} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 text-xs text-ink-soft">
        <Link to="/guidelines" className="hover:underline">
          About
        </Link>
        <Link to="/guidelines" className="hover:underline">
          Help
        </Link>
        <Link to="/guidelines" className="hover:underline">
          Privacy
        </Link>
        <Link to="/guidelines" className="hover:underline">
          Terms
        </Link>
      </div>
    </div>
  );
}
