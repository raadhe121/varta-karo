import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Avatar from '../common/Avatar';
import { fetchContacts } from '../../api/contacts.api';
import { createConversation } from '../../api/chat.api';

export default function NewGroupModal({ open, onClose, onCreated }) {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchContacts().then(setContacts);
      setSelected(new Set());
      setName('');
    }
  }, [open]);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const submit = async (e) => {
    e.preventDefault();
    if (selected.size < 2) return;
    setLoading(true);
    try {
      const conversation = await createConversation({
        type: 'group',
        name,
        participantIds: Array.from(selected),
      });
      onCreated(conversation);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New group">
      <form onSubmit={submit} className="space-y-3">
        <input className="input" placeholder="Group name" value={name} onChange={(e) => setName(e.target.value)} required />
        <p className="text-xs text-ink-soft">Pick at least 2 contacts</p>
        <div className="max-h-56 overflow-y-auto flex flex-col gap-1">
          {contacts.map((user) => (
            <label key={user.id} className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-paper-soft cursor-pointer">
              <input type="checkbox" checked={selected.has(user.id)} onChange={() => toggle(user.id)} />
              <Avatar user={user} size="sm" />
              <span className="text-sm">{user.name}</span>
            </label>
          ))}
        </div>
        <Button type="submit" className="w-full" disabled={loading || selected.size < 2 || !name}>
          {loading ? 'Creating...' : 'Create group'}
        </Button>
      </form>
    </Modal>
  );
}
