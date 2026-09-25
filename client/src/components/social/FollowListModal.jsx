import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { fetchFollowers, fetchFollowing } from '../../api/social.api';

export default function FollowListModal({ open, onClose, userId, type, onSelectUser }) {
  const [users, setUsers] = useState(null);

  useEffect(() => {
    if (!open) return;
    setUsers(null);
    const fetcher = type === 'followers' ? fetchFollowers : fetchFollowing;
    fetcher(userId).then(setUsers);
  }, [open, userId, type]);

  return (
    <Modal open={open} onClose={onClose} title={type === 'followers' ? 'Followers' : 'Following'}>
      {users === null ? (
        <p className="text-sm text-ink-soft py-4 text-center">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-ink-soft py-4 text-center">
          {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
        </p>
      ) : (
        <div className="max-h-80 overflow-y-auto flex flex-col gap-1">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onSelectUser(user.id);
                onClose();
              }}
              className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-paper-soft text-left"
            >
              <Avatar user={user} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-ink-soft truncate">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
