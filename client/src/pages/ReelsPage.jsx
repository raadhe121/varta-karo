import { useCallback, useEffect, useRef, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import IncomingCallModal from '../components/call/IncomingCallModal';
import ActiveCallOverlay from '../components/call/ActiveCallOverlay';
import HomeTopBar from '../components/layout/HomeTopBar';
import FeedSidebar from '../components/layout/FeedSidebar';
import MobileTabBar from '../components/layout/MobileTabBar';
import CreatePostModal from '../components/social/CreatePostModal';
import ReelItem from '../components/reels/ReelItem';
import ReelCommentsPanel from '../components/reels/ReelCommentsPanel';
import { fetchReels } from '../api/posts.api';

export default function ReelsPage() {
  useSocket();

  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exhausted, setExhausted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [commentsFor, setCommentsFor] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);

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

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowUp') scrollToIndex(Math.max(0, activeIndex - 1));
      if (e.key === 'ArrowDown') scrollToIndex(Math.min(reels.length - 1, activeIndex + 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, reels.length]);

  const handleFollowChange = () => {
    // Re-fetching the whole feed just to flip one badge is overkill; the
    // FollowButton already reflects the optimistic state itself.
  };

  const handleCommentAdded = (reelId) => {
    setReels((prev) => prev.map((r) => (r.id === reelId ? { ...r, commentCount: r.commentCount + 1 } : r)));
  };

  return (
    <div className="h-screen flex flex-col bg-page overflow-hidden">
      <IncomingCallModal />
      <ActiveCallOverlay />
      {composerOpen && <CreatePostModal onClose={() => setComposerOpen(false)} />}

      <HomeTopBar onCreate={() => setComposerOpen(true)} />

      <FeedSidebar />

      <div className="flex-1 flex min-h-0 lg:pl-64">
        <div className="relative flex-1 min-w-0 overflow-hidden">
          {loading && reels.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-ink-soft text-sm">Loading reels...</div>
          )}
          {!loading && reels.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-ink-soft text-sm">No reels yet.</div>
          )}

          <div
            ref={containerRef}
            className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth py-6"
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

          <div className="hidden xl:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-2 z-10">
            <button
              onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              className="flex items-center gap-1.5 rounded-full bg-paper border border-line text-ink text-sm font-semibold px-4 py-2 disabled:opacity-30"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m18 15-6-6-6 6" />
              </svg>
              Previous reel
            </button>
            <button
              onClick={() => scrollToIndex(Math.min(reels.length - 1, activeIndex + 1))}
              disabled={activeIndex >= reels.length - 1}
              className="flex items-center gap-1.5 rounded-full bg-accent text-white text-sm font-semibold px-4 py-2 disabled:opacity-30"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
              Next reel
            </button>
            <p className="text-xs text-ink-soft mt-1">Tip: use &uarr;&darr; keys or scroll</p>
          </div>
        </div>
      </div>

      <ReelCommentsPanel reel={commentsFor} onClose={() => setCommentsFor(null)} onCommentAdded={handleCommentAdded} />
      <MobileTabBar onCreate={() => setComposerOpen(true)} />
    </div>
  );
}
