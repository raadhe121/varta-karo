import { useCallback, useEffect, useState } from 'react';
import { resolveMediaUrl } from '../../utils/media';

const IMAGE_DURATION = 5000;

// A lightweight, non-expiring cousin of StoryViewer for playing back a
// profile highlight's items -- no viewer tracking or replies since these
// aren't ephemeral stories anymore, just a saved reel of past ones.
export default function HighlightViewer({ highlight, onClose }) {
  const [index, setIndex] = useState(0);
  const item = highlight.items[index];

  const goNext = useCallback(() => {
    if (index < highlight.items.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [index, highlight.items.length, onClose]);

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));

  useEffect(() => {
    if (item?.mediaType === 'video') return undefined;
    const timer = setTimeout(goNext, IMAGE_DURATION);
    return () => clearTimeout(timer);
  }, [index, item, goNext]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full max-w-sm h-full sm:h-[90vh] sm:rounded-2xl overflow-hidden bg-paper-dark">
        <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
          {highlight.items.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white" style={{ width: i < index ? '100%' : i === index ? '100%' : '0%' }} />
            </div>
          ))}
        </div>
        <div className="absolute top-6 left-3 right-3 z-20 flex items-center justify-between">
          <span className="text-white text-sm font-semibold">{highlight.name}</span>
          <button onClick={onClose} className="text-white text-xl leading-none">
            &times;
          </button>
        </div>

        {item.mediaType === 'video' ? (
          <video
            key={item.id}
            src={resolveMediaUrl(item.mediaUrl)}
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-black"
            onEnded={goNext}
          />
        ) : (
          <img key={item.id} src={resolveMediaUrl(item.mediaUrl)} alt="" className="w-full h-full object-contain bg-black" />
        )}

        <button aria-label="Previous" onClick={goPrev} className="absolute left-0 top-0 h-full w-1/3 z-10" />
        <button aria-label="Next" onClick={goNext} className="absolute right-0 top-0 h-full w-1/3 z-10" />
      </div>
    </div>
  );
}
