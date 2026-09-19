import { useState } from 'react';
import { searchUsers, sendContactRequest } from '../../api/contacts.api';
import Avatar from '../common/Avatar';
import Button from '../common/Button';

export default function ContactSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [sentTo, setSentTo] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const runSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const users = await searchUsers(q);
      setResults(users);
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (userId) => {
    try {
      await sendContactRequest(userId);
      setSentTo((prev) => new Set(prev).add(userId));
    } catch {
      // request may already exist; surface nothing further for MVP
      setSentTo((prev) => new Set(prev).add(userId));
    }
  };

  return (
    <div>
      <input
        className="input mb-3"
        placeholder="Search by name, username, email or phone"
        value={query}
        onChange={(e) => runSearch(e.target.value)}
      />
      {loading && <p className="text-xs text-ink-soft">Searching...</p>}
      <div className="flex flex-col gap-2">
        {results.map((user) => (
          <div key={user.id} className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-paper-soft">
            <Avatar user={user} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-ink-soft truncate">@{user.username}</p>
            </div>
            <Button variant="outline" className="text-xs px-2 py-1" disabled={sentTo.has(user.id)} onClick={() => addContact(user.id)}>
              {sentTo.has(user.id) ? 'Sent' : 'Add'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
