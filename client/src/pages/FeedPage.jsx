import { useEffect, useState } from 'react';
import { fetchFeed } from '../api/posts.api';
import AppNav from '../components/layout/AppNav';
import PostComposer from '../components/social/PostComposer';
import PostCard from '../components/social/PostCard';
import StoriesRow from '../components/social/StoriesRow';
import ActiveFriends from '../components/social/ActiveFriends';
import ProfileSummaryCard from '../components/social/ProfileSummaryCard';
import Spinner from '../components/common/Spinner';

export default function FeedPage() {
  const [posts, setPosts] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchFeed().then((data) => {
      setPosts(data);
      setHasMore(data.length >= 20);
    });
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
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <div className="max-w-6xl w-full mx-auto px-4 py-6 grid grid-cols-[260px_1fr_280px] gap-6 items-start">
        <div className="sticky top-6">
          <ProfileSummaryCard />
        </div>

        <div className="space-y-4 min-w-0">
          <div className="rounded-2xl bg-paper p-4 shadow-sm shadow-ink/5">
            <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Stories</p>
            <StoriesRow />
          </div>

          <PostComposer onCreated={(post) => setPosts((prev) => [post, ...(prev || [])])} />

          {posts === null ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-ink-soft text-center py-8">
              No posts yet. Friend or follow someone, or share your first post above.
            </p>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))} />
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

        <div className="sticky top-6">
          <ActiveFriends />
        </div>
      </div>
    </div>
  );
}
