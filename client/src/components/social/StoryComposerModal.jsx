import { useState } from 'react';
import { createStory } from '../../api/stories.api';
import Button from '../common/Button';

export default function StoryComposerModal({ mediaUrl, mediaType, onClose, onCreated }) {
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);

  const share = async () => {
    setPosting(true);
    try {
      const story = await createStory({ mediaUrl, mediaType, caption: caption.trim() || undefined });
      onCreated(story);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-paper rounded-2xl overflow-hidden">
        <div className="bg-black flex items-center justify-center">
          {mediaType === 'video' ? (
            <video src={mediaUrl} controls className="w-full max-h-[60vh] object-contain" />
          ) : (
            <img src={mediaUrl} alt="" className="w-full max-h-[60vh] object-contain" />
          )}
        </div>
        <div className="p-4 space-y-3">
          <input
            className="input"
            placeholder="Add a caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={posting} className="px-4 py-2 text-sm text-ink-soft">
              Cancel
            </button>
            <Button onClick={share} disabled={posting}>
              {posting ? 'Sharing...' : 'Share to Story'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
