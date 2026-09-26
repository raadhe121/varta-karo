import { useEffect, useState } from 'react';
import { fetchHighlights, createHighlight } from '../../api/highlights.api';
import { fetchUserStories } from '../../api/stories.api';
import { resolveMediaUrl } from '../../utils/media';
import HighlightViewer from './HighlightViewer';

function CreateHighlightModal({ userId, onClose, onCreated }) {
  const [stories, setStories] = useState(null);
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserStories(userId).then(setStories);
  }, [userId]);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || selected.length === 0) return;
    setSaving(true);
    try {
      const highlight = await createHighlight(name.trim(), selected);
      onCreated(highlight);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        className="bg-paper rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <p className="font-semibold">New highlight</p>
          <button type="button" onClick={onClose} className="text-ink-soft text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          <input className="input" placeholder="Highlight name" value={name} onChange={(e) => setName(e.target.value)} />

          <p className="text-xs uppercase tracking-wide font-semibold text-ink-soft">Choose stories</p>
          {stories === null ? (
            <p className="text-sm text-ink-soft">Loading...</p>
          ) : stories.length === 0 ? (
            <p className="text-sm text-ink-soft">You have no active stories to pick from. Post a story first.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {stories.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                    selected.includes(s.id) ? 'border-accent' : 'border-transparent'
                  }`}
                >
                  {s.mediaType === 'video' ? (
                    <video src={resolveMediaUrl(s.mediaUrl)} className="w-full h-full object-cover" />
                  ) : (
                    <img src={resolveMediaUrl(s.mediaUrl)} alt="" className="w-full h-full object-cover" />
                  )}
                  {selected.includes(s.id) && (
                    <span className="absolute inset-0 bg-accent/30 flex items-center justify-center text-white font-bold">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-line">
          <button
            type="submit"
            disabled={saving || !name.trim() || selected.length === 0}
            className="w-full rounded-xl bg-accent text-white font-semibold text-sm py-2.5 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create highlight'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function HighlightsRow({ userId, isSelf }) {
  const [highlights, setHighlights] = useState(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    fetchHighlights(userId).then(setHighlights);
  }, [userId]);

  if (highlights === null) return null;
  if (highlights.length === 0 && !isSelf) return null;

  return (
    <div className="flex gap-4 overflow-x-auto py-2">
      {highlights.map((h) => (
        <button key={h.id} onClick={() => setViewing(h)} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
          <div className="h-16 w-16 rounded-full border-2 border-line overflow-hidden bg-paper-soft">
            {h.coverUrl && <img src={resolveMediaUrl(h.coverUrl)} alt="" className="w-full h-full object-cover" />}
          </div>
          <span className="text-[11px] text-ink-soft truncate w-full text-center">{h.name}</span>
        </button>
      ))}

      {isSelf && (
        <button onClick={() => setCreating(true)} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
          <div className="h-16 w-16 rounded-full border-2 border-dashed border-line flex items-center justify-center text-ink-soft">
            +
          </div>
          <span className="text-[11px] text-ink-soft truncate w-full text-center">New</span>
        </button>
      )}

      {creating && (
        <CreateHighlightModal
          userId={userId}
          onClose={() => setCreating(false)}
          onCreated={(h) => {
            setHighlights((prev) => [...prev, h]);
            setCreating(false);
          }}
        />
      )}

      {viewing && <HighlightViewer highlight={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
