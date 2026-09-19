import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchFriends } from '../../api/social.api';
import Avatar from '../common/Avatar';

export default function ActiveFriends() {
  const [friends, setFriends] = useState(null);

  useEffect(() => {
    fetchFriends().then(setFriends);
  }, []);

  if (!friends) return null;

  const online = friends.filter((f) => f.status === 'online');

  return (
    <div className="rounded-2xl bg-paper p-4 shadow-sm shadow-ink/5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-display font-semibold text-sm">Active Friends</p>
        <span className="text-xs text-ink-soft">{online.length} online</span>
      </div>
      {online.length === 0 ? (
        <p className="text-sm text-ink-soft">No friends online right now.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {online.map((f) => (
            <Link key={f.id} to={`/profile/${f.id}`} className="flex items-center gap-2.5 hover:bg-paper-soft rounded-xl px-1.5 py-1">
              <Avatar user={f} size="sm" showStatus isOnline />
              <span className="text-sm font-medium">{f.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
