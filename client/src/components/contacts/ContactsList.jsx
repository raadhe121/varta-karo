import { useEffect, useState } from 'react';
import { fetchContacts } from '../../api/contacts.api';
import Avatar from '../common/Avatar';
import { usePresenceStore } from '../../store/presenceStore';

export default function ContactsList({ onStartChat, refreshKey }) {
  const [contacts, setContacts] = useState([]);
  const isOnline = usePresenceStore((s) => s.isOnline);
  const seedFromUsers = usePresenceStore((s) => s.seedFromUsers);

  useEffect(() => {
    fetchContacts().then((list) => {
      setContacts(list);
      seedFromUsers(list);
    });
  }, [refreshKey, seedFromUsers]);

  if (contacts.length === 0) {
    return <p className="text-sm text-ink-soft px-2 py-4">No contacts yet. Search above to add someone.</p>;
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-soft mb-2">Contacts</p>
      <div className="flex flex-col gap-1">
        {contacts.map((user) => (
          <button
            key={user.id}
            onClick={() => onStartChat(user)}
            className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-paper-soft text-left"
          >
            <Avatar user={user} size="sm" showStatus isOnline={isOnline(user.id)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-ink-soft truncate">@{user.username}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
