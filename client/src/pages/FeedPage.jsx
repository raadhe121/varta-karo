import { useEffect, useState } from 'react';
import { fetchFeed } from '../api/posts.api';
import AppNav from '../components/layout/AppNav';
import PostCard from '../components/social/PostCard';
import StoriesRow from '../components/social/StoriesRow';
import SuggestionsSidebar from '../components/social/SuggestionsSidebar';
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
    <div className="min-h-screen flex flex-col bg-page">
      <AppNav />
      <div className="w-[90%] mx-auto px-4 py-8 grid grid-cols-[7fr_3fr] gap-10 items-start">
        <div className="space-y-6 min-w-0">
          <div className="rounded-xl bg-paper border border-line px-4 py-4">
            <StoriesRow />
          </div>

          {posts === null ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : posts.length === 0 ? (
            <p className="text-sm text-ink-soft text-center py-8">
              No posts yet. Friend or follow someone to see their posts here.
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

        <div className="sticky top-8">
          <SuggestionsSidebar />
        </div>
      </div>
    </div>
  );
}
