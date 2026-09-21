import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFeed } from '../api/posts.api';
import { searchUsers } from '../api/contacts.api';
import Avatar from '../components/common/Avatar';

/** Ports the mobile app's explore-grid-then-search-results screen: an empty
 * query shows a discovery grid of recent public posts (closest thing this
 * backend has to an "explore" feed); typing switches to a live user search. */
export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [explore, setExplore] = useState(null);
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
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
  const posts = (explore || []).filter((p) => p.imageUrl);

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-paper sticky top-0 z-10">
        <button onClick={() => navigate('/feed')} className="text-ink-soft hover:text-ink text-xl leading-none px-1">
          &larr;
        </button>
        <div className="flex-1 flex items-center gap-2 bg-paper-soft rounded-full px-3.5 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-soft shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            autoFocus
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-ink-soft hover:text-ink shrink-0">
              &times;
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-3xl w-full mx-auto">
        {isSearching ? (
          searching && results === null ? (
            <p className="text-sm text-ink-soft text-center py-10">Searching...</p>
          ) : (results || []).length === 0 ? (
            <p className="text-sm text-ink-soft text-center py-10">No people found.</p>
          ) : (
            <div className="divide-y divide-line">
              {results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => navigate(`/profile/${u.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-paper-soft text-left"
                >
                  <Avatar user={u} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{u.username}</p>
                    <p className="text-xs text-ink-soft truncate">{u.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : explore === null ? (
          <p className="text-sm text-ink-soft text-center py-10">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-ink-soft text-center py-10">Nothing to explore yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {posts.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate('/feed')}
                className="relative aspect-square bg-paper-dark overflow-hidden"
              >
                {p.mediaType === 'video' ? (
                  <span className="absolute inset-0 flex items-center justify-center text-white/70">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                ) : (
                  <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
