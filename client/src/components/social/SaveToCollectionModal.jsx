import { useEffect, useState } from 'react';
import { fetchCollections, createCollection } from '../../api/collections.api';
import { toggleSave } from '../../api/posts.api';
import Button from '../common/Button';

export default function SaveToCollectionModal({ postId, onClose, onSaved }) {
  const [collections, setCollections] = useState(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchCollections().then(setCollections);
  }, []);

  const saveTo = async (collectionId) => {
    setSavingId(collectionId ?? 'none');
    try {
      await toggleSave(postId, collectionId);
      onSaved?.();
    } finally {
      setSavingId(null);
    }
  };

  const createAndSave = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const collection = await createCollection(newName.trim());
      await saveTo(collection.id);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-paper rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <p className="font-semibold">Save to...</p>
          <button onClick={onClose} className="text-ink-soft text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {collections === null ? (
            <p className="text-sm text-ink-soft text-center py-6">Loading...</p>
          ) : (
            collections.map((c) => (
              <button
                key={c.id ?? 'none'}
                onClick={() => saveTo(c.id)}
                disabled={savingId !== null}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-paper-soft text-left disabled:opacity-50"
              >
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-xs text-ink-soft">
                  {savingId === (c.id ?? 'none') ? 'Saving...' : `${c.postCount} post${c.postCount === 1 ? '' : 's'}`}
                </span>
              </button>
            ))
          )}
        </div>

        <form onSubmit={createAndSave} className="flex items-center gap-2 p-3 border-t border-line">
          <input
            className="input"
            placeholder="New collection name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button type="submit" disabled={creating || !newName.trim()} className="shrink-0">
            {creating ? '...' : 'Create'}
          </Button>
        </form>
      </div>
    </div>
  );
}
