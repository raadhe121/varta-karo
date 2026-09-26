import { useNavigate } from 'react-router-dom';
import { fetchUserByUsername } from '../../api/users.api';

// Splits on #hashtag and @mention tokens, rendering the rest as plain text.
// Hashtags open Search pre-filled with that tag; mentions resolve the
// username to a profile id and navigate there.
const TOKEN_RE = /([#@][a-zA-Z0-9_.]+)/g;

export default function RichText({ text, className }) {
  const navigate = useNavigate();
  if (!text) return null;

  const goToMention = async (username) => {
    try {
      const user = await fetchUserByUsername(username);
      navigate(`/profile/${user.id}`);
    } catch {
      // Username doesn't resolve to a real account -- leave the click inert
      // rather than navigating somewhere broken.
    }
  };

  const parts = text.split(TOKEN_RE);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('#') && part.length > 1) {
          return (
            <button
              key={i}
              onClick={() => navigate(`/search?q=${encodeURIComponent(part)}`)}
              className="text-accent font-medium hover:underline"
            >
              {part}
            </button>
          );
        }
        if (part.startsWith('@') && part.length > 1) {
          return (
            <button key={i} onClick={() => goToMention(part.slice(1))} className="text-accent font-medium hover:underline">
              {part}
            </button>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
