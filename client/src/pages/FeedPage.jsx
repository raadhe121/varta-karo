import { useEffect, useState } from 'react';
import { fetchFeed, fetchDiscoverPosts } from '../api/posts.api';
import AppNav from '../components/layout/AppNav';
import PostCard from '../components/social/PostCard';
import StoriesRow from '../components/social/StoriesRow';
import SuggestionsSidebar from '../components/social/SuggestionsSidebar';
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
  const [posts, setPosts] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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
      <AppNav />
      <div className="relative px-4 py-8 lg:pr-[356px]">
        <div className="max-w-[640px] mx-auto space-y-6">
          <div className="rounded-xl bg-paper border border-line px-4 py-4">
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
        </div>

        <div className="hidden lg:block fixed top-24 right-6 w-[320px]">
          <SuggestionsSidebar />
        </div>
      </div>
    </div>
  );
}
