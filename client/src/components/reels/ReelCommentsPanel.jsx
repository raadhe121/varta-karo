import { useEffect, useState } from 'react';
import Avatar from '../common/Avatar';
import { fetchComments, addComment } from '../../api/posts.api';

export default function ReelCommentsPanel({ reel, onClose, onCommentAdded }) {
  const [comments, setComments] = useState(null);
  const [text, setText] = useState('');

  useEffect(() => {
    if (!reel) return;
    setComments(null);
    fetchComments(reel.id).then(setComments);
  }, [reel]);

  if (!reel) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const comment = await addComment(reel.id, text.trim());
    setComments((prev) => [...(prev || []), comment]);
    setText('');
    onCommentAdded(reel.id);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center sm:justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl bg-paper max-h-[75vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <p className="font-semibold text-sm">Comments</p>
          <button onClick={onClose} className="text-ink-soft text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {comments === null && <p className="text-sm text-ink-soft">Loading...</p>}
          {comments?.length === 0 && <p className="text-sm text-ink-soft">No comments yet. Say something!</p>}
          {comments?.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar user={c.author} size="sm" />
              <div className="bg-paper-soft rounded-xl px-3 py-1.5 text-sm">
                <span className="font-semibold mr-1">{c.author.name}</span>
                {c.content}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="flex gap-2 px-4 py-3 border-t border-line">
          <input
            className="input flex-1"
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <button type="submit" className="text-accent font-semibold text-sm disabled:opacity-40" disabled={!text.trim()}>
            Post
          </button>
        </form>
      </div>
    </div>
  );
}
