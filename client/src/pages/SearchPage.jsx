import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import IncomingCallModal from '../components/call/IncomingCallModal';
import ActiveCallOverlay from '../components/call/ActiveCallOverlay';
import HomeTopBar from '../components/layout/HomeTopBar';
import FeedSidebar from '../components/layout/FeedSidebar';
import MobileTabBar from '../components/layout/MobileTabBar';
import CreatePostModal from '../components/social/CreatePostModal';
import FollowButton from '../components/social/FollowButton';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import { fetchFeed } from '../api/posts.api';
import { searchUsers } from '../api/users.api';
import { createConversation } from '../api/chat.api';
import { useChatStore } from '../store/chatStore';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'people', label: 'People' },
  { id: 'posts', label: 'Posts' },
  { id: 'reels', label: 'Reels' },
];

function Highlight({ text, query }) {
  if (!query) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent text-inherit font-bold">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

function PersonRow({ person, query, onFollowChange }) {
  const navigate = useNavigate();
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const [messaging, setMessaging] = useState(false);

  const message = async () => {
    setMessaging(true);
    try {
      const conversation = await createConversation({ type: 'direct', participantIds: [person.id] });
      upsertConversation(conversation);
      setActiveConversation(conversation.id);
      navigate('/chat');
    } finally {
      setMessaging(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-paper border border-line p-4">
      <button onClick={() => navigate(`/profile/${person.id}`)} className="shrink-0">
        <Avatar user={person} size="md" />
      </button>
      <div className="flex-1 min-w-0">
        <button onClick={() => navigate(`/profile/${person.id}`)} className="text-left block">
          <span className="text-sm font-semibold hover:underline">
            <Highlight text={person.name} query={query} />
          </span>
        </button>
        <p className="text-xs text-ink-soft truncate">
          @<Highlight text={person.username} query={query} />
          {person.isFollowedBy && ' · Follows you'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" className="text-sm" disabled={messaging} onClick={message}>
          Message
        </Button>
        <FollowButton profile={person} onChange={onFollowChange} />
      </div>
    </div>
  );
}

export default function SearchPage() {
  useSocket();
  const [query, setQuery] = useState('');
  const [explore, setExplore] = useState(null);
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetchFeed().then(setExplore);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    clearTimeout(debounceRef.current);
    if (!trimmed) {
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const data = await searchUsers(trimmed);
      setResults(data);
      setSearching(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const isSearching = query.trim().length > 0;
  const trimmed = query.trim().toLowerCase();

  const matchingPosts = (explore || []).filter((p) => p.content?.toLowerCase().includes(trimmed));
  const posts = matchingPosts.filter((p) => p.mediaType !== 'video' || filter === 'all' || filter === 'posts');
  const reels = matchingPosts.filter((p) => p.mediaType === 'video');

  const showPeople = filter === 'all' || filter === 'people';
  const showPosts = filter === 'all' || filter === 'posts';
  const showReels = filter === 'all' || filter === 'reels';
  const postsAndReels = [...(showPosts ? posts.filter((p) => p.mediaType !== 'video') : []), ...(showReels ? reels : [])];

  const explorePosts = (explore || []).filter((p) => p.imageUrl);

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <IncomingCallModal />
      <ActiveCallOverlay />
      {composerOpen && <CreatePostModal onClose={() => setComposerOpen(false)} />}

      <HomeTopBar onCreate={() => setComposerOpen(true)} searchValue={query} onSearchChange={setQuery} />
      <FeedSidebar />

      <div className="flex-1 flex justify-center gap-8 px-0 lg:pl-64 lg:pr-6 py-0 lg:py-6">
        <main className="flex-1 max-w-[680px] px-4 lg:px-0 py-4 lg:py-0 pb-16 lg:pb-0">
          {!isSearching ? (
            <>
              <p className="font-display text-3xl font-bold mb-4">Explore</p>
              {explore === null ? (
                <p className="text-sm text-ink-soft text-center py-10">Loading...</p>
              ) : explorePosts.length === 0 ? (
                <p className="text-sm text-ink-soft text-center py-10">Nothing to explore yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-0.5">
                  {explorePosts.map((p) => (
                    <div key={p.id} className="relative aspect-square bg-paper-dark overflow-hidden rounded-md">
                      {p.mediaType === 'video' ? (
                        <span className="absolute inset-0 flex items-center justify-center text-white/70">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      ) : (
                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <p className="font-display text-3xl font-bold">Results for &ldquo;{query}&rdquo;</p>
              <p className="text-sm text-ink-soft mt-1 mb-4">
                {searching ? 'Searching...' : `${(results || []).length} ${(results || []).length === 1 ? 'person' : 'people'} found`}
              </p>

              <div className="flex items-center gap-1.5 pb-4">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`text-sm font-semibold px-4 py-1.5 rounded-full ${
                      filter === f.id ? 'bg-paper text-ink border border-line' : 'bg-paper-soft text-ink-soft hover:bg-line'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {showPeople && (
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wide font-semibold text-ink-soft mb-2">People</p>
                  {searching && results === null ? (
                    <p className="text-sm text-ink-soft py-4">Searching...</p>
                  ) : (results || []).length === 0 ? (
                    <p className="text-sm text-ink-soft py-4">No people found.</p>
                  ) : (
                    <div className="space-y-2">
                      {results.map((u) => (
                        <PersonRow
                          key={u.id}
                          person={u}
                          query={query}
                          onFollowChange={() => searchUsers(query.trim()).then(setResults)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {(showPosts || showReels) && (
                <div>
                  <p className="text-xs uppercase tracking-wide font-semibold text-ink-soft mb-2">Posts &amp; Reels</p>
                  {postsAndReels.length === 0 ? (
                    <div className="rounded-2xl border-2 border-dashed border-line p-10 text-center">
                      <p className="font-semibold">No posts match &ldquo;{query}&rdquo;</p>
                      <p className="text-sm text-ink-soft mt-1">Try a longer word or a hashtag.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {postsAndReels.map((p) => (
                        <div key={p.id} className="relative aspect-square bg-paper-dark overflow-hidden rounded-lg">
                          {p.mediaType === 'video' ? (
                            <span className="absolute inset-0 flex items-center justify-center text-white/70">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </span>
                          ) : (
                            <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>

        <div className="hidden xl:block w-[320px] shrink-0">
          <div className="rounded-2xl bg-paper border border-line p-5">
            <p className="font-display font-semibold text-lg mb-2">Search tips</p>
            <p className="text-sm text-ink-soft">Type a name or @username to find people. Use # to find posts by topic.</p>
          </div>
        </div>
      </div>

      <MobileTabBar onCreate={() => setComposerOpen(true)} />
    </div>
  );
}
