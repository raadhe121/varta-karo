import { useCallback, useEffect, useRef, useState } from 'react';
import AppNav from '../components/layout/AppNav';
import ReelItem from '../components/reels/ReelItem';
import ReelCommentsPanel from '../components/reels/ReelCommentsPanel';
import { fetchReels } from '../api/posts.api';

export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exhausted, setExhausted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [commentsFor, setCommentsFor] = useState(null);

  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const loadingMoreRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || exhausted) return;
    loadingMoreRef.current = true;
    const before = reels.length ? reels[reels.length - 1].createdAt : undefined;
    const batch = await fetchReels(before);
    if (batch.length === 0) setExhausted(true);
    setReels((prev) => [...prev, ...batch]);
    loadingMoreRef.current = false;
    setLoading(false);
  }, [reels, exhausted]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onCreated = (e) => {
      if (e.detail.mediaType === 'video') setReels((prev) => [e.detail, ...prev]);
    };
    window.addEventListener('post:created', onCreated);
    return () => window.removeEventListener('post:created', onCreated);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const index = Number(visible.target.dataset.index);
          setActiveIndex(index);
          if (index >= reels.length - 3) loadMore();
        }
      },
      { root: container, threshold: [0.6] }
    );

    itemRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reels.length]);

  const scrollToIndex = (index) => {
    const node = itemRefs.current[index];
    node?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFollowChange = () => {
    // Re-fetching the whole feed just to flip one badge is overkill; the
    // FollowButton already reflects the optimistic state itself.
  };

  const handleCommentAdded = (reelId) => {
    setReels((prev) => prev.map((r) => (r.id === reelId ? { ...r, commentCount: r.commentCount + 1 } : r)));
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      <AppNav />

      <div className="relative flex-1 overflow-hidden">
        {loading && reels.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">Loading reels...</div>
        )}
        {!loading && reels.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">No reels yet.</div>
        )}

        <div
          ref={containerRef}
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none' }}
        >
          {reels.map((reel, index) => (
            <div
              key={reel.id}
              ref={(node) => (itemRefs.current[index] = node)}
              data-index={index}
              className="h-full w-full snap-start"
            >
              <ReelItem
                reel={reel}
                isActive={index === activeIndex}
                muted={muted}
                onToggleMute={() => setMuted((m) => !m)}
                onOpenComments={setCommentsFor}
                onFollowChange={handleFollowChange}
              />
            </div>
          ))}
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
          <button
            onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center disabled:opacity-30"
            title="Previous"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m18 15-6-6-6 6" />
            </svg>
          </button>
          <button
            onClick={() => scrollToIndex(Math.min(reels.length - 1, activeIndex + 1))}
            disabled={activeIndex >= reels.length - 1}
            className="h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center disabled:opacity-30"
            title="Next"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      <ReelCommentsPanel reel={commentsFor} onClose={() => setCommentsFor(null)} onCommentAdded={handleCommentAdded} />
    </div>
  );
}
