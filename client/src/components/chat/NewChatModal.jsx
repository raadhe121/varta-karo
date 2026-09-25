import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { fetchMutualFollows } from '../../api/social.api';
import { createConversation } from '../../api/chat.api';

/** Starting a direct chat requires a follow-back: only people who follow the
 * current user and are followed by them show up here — the server enforces
 * the same rule in conversation.controller.createConversation, this is just
 * the picker for it. */
export default function NewChatModal({ open, onClose, onCreated }) {
  const [users, setUsers] = useState(null);
  const [creatingId, setCreatingId] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      setUsers(null);
      setQuery('');
      fetchMutualFollows().then(setUsers);
    }
  }, [open]);

  const filtered = (users || []).filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q);
  });

  const startChat = async (userId) => {
    setCreatingId(userId);
    try {
      const conversation = await createConversation({ type: 'direct', participantIds: [userId] });
      onCreated(conversation);
      onClose();
    } finally {
      setCreatingId(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New chat">
      {users === null ? (
        <p className="text-sm text-ink-soft py-4 text-center">Loading...</p>
      ) : users.length === 0 ? (
        <p className="text-sm text-ink-soft py-4 text-center">
          You can chat with people once you follow each other. Follow someone, and once they follow you back,
          they'll show up here.
        </p>
      ) : (
        <>
          <input
            className="input mb-3"
            placeholder="Search friends..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {filtered.length === 0 ? (
            <p className="text-sm text-ink-soft py-4 text-center">No matches for &ldquo;{query}&rdquo;.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto flex flex-col gap-1">
              {filtered.map((user) => (
                <button
                  key={user.id}
                  onClick={() => startChat(user.id)}
                  disabled={creatingId === user.id}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-paper-soft text-left disabled:opacity-50"
                >
                  <Avatar user={user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-ink-soft truncate">@{user.username}</p>
                  </div>
                  {creatingId === user.id && (
                    <span className="h-3 w-3 rounded-full border-2 border-accent border-t-transparent animate-spin shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
