import { useEffect, useState } from 'react';
import { fetchFeed, fetchDiscoverPosts } from '../api/posts.api';
import { useSocket } from '../hooks/useSocket';
import IncomingCallModal from '../components/call/IncomingCallModal';
import ActiveCallOverlay from '../components/call/ActiveCallOverlay';
import HomeTopBar from '../components/layout/HomeTopBar';
import FeedSidebar from '../components/layout/FeedSidebar';
import MobileTabBar from '../components/layout/MobileTabBar';
import PostCard from '../components/social/PostCard';
import StoriesRow from '../components/social/StoriesRow';
import HomeComposerBar from '../components/social/HomeComposerBar';
import HomeRightRail from '../components/social/HomeRightRail';
import CreatePostModal from '../components/social/CreatePostModal';
import Spinner from '../components/common/Spinner';

// Minimum number of cards the feed tries to show. Whatever a follows-only
// feed comes up short of this gets padded out with random public posts
// (each carrying its own `followedByMe`, so PostCard shows a Follow
// button on the ones that aren't from someone already followed) -- a
// heavy follower always sees mostly their own network, a fresh account
// with nobody followed sees an all-discover feed, everyone in between
// sees a mix.
const MIN_FEED_SIZE = 20;

export default function FeedPage() {
  useSocket();

  const [posts, setPosts] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);

  useEffect(() => {
    fetchFeed().then(async (data) => {
      setHasMore(data.length >= MIN_FEED_SIZE);
      if (data.length >= MIN_FEED_SIZE) {
        setPosts(data);
        return;
      }

      const seenIds = new Set(data.map((p) => p.id));
      const discovered = await fetchDiscoverPosts();
      const filler = discovered.filter((p) => !seenIds.has(p.id)).slice(0, MIN_FEED_SIZE - data.length);
      setPosts([...data, ...filler]);
    });
  }, []);

  useEffect(() => {
    const onCreated = (e) => setPosts((prev) => (prev ? [e.detail, ...prev] : prev));
    window.addEventListener('post:created', onCreated);
    return () => window.removeEventListener('post:created', onCreated);
  }, []);

  const loadMore = async () => {
    if (!posts || posts.length === 0) return;
    setLoadingMore(true);
    const older = await fetchFeed(posts[posts.length - 1].createdAt);
    setPosts((prev) => [...prev, ...older]);
    setHasMore(older.length >= 20);
    setLoadingMore(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <IncomingCallModal />
      <ActiveCallOverlay />
      {composerOpen && (
        <CreatePostModal
          onClose={() => setComposerOpen(false)}
          onCreated={(post) => {
            setPosts((prev) => (prev ? [post, ...prev] : prev));
            setComposerOpen(false);
          }}
        />
      )}

      <HomeTopBar onCreate={() => setComposerOpen(true)} />

      <FeedSidebar />

      <div className="flex-1 flex justify-center gap-8 px-0 lg:pl-64 lg:pr-6 py-0 lg:py-6">
        <main className="flex-1 max-w-[640px] space-y-0 lg:space-y-4 pb-16 lg:pb-0">
          <div className="hidden lg:block">
            <HomeComposerBar onOpen={() => setComposerOpen(true)} />
          </div>

          <div className="border-b border-line px-4 py-3 lg:rounded-2xl lg:bg-paper lg:border lg:p-4">
            <div className="hidden lg:flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Stories</p>
              <button className="text-xs font-semibold text-accent">See all</button>
            </div>
            <StoriesRow />
          </div>

          {posts === null ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-ink-soft text-center py-8">Nothing to show right now.</p>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  showFollowButton={!post.followedByMe}
                  onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                />
              ))}
              {hasMore && (
                <div className="flex justify-center py-4">
                  <button onClick={loadMore} disabled={loadingMore} className="text-sm text-accent hover:underline">
                    {loadingMore ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>

        <div className="hidden xl:block w-[320px] shrink-0">
          <HomeRightRail />
        </div>
      </div>

      <MobileTabBar onCreate={() => setComposerOpen(true)} />
    </div>
  );
}
