import { useEffect, useState } from 'react';
import Avatar from '../common/Avatar';
import RichText from '../common/RichText';
import { fetchComments, addComment } from '../../api/posts.api';

function Comment({ comment, onReply }) {
  return (
    <div className="flex items-start gap-2">
      <Avatar user={comment.author} size="sm" />
      <div>
        <div className="bg-paper-soft rounded-xl px-3 py-1.5 text-sm">
          <span className="font-semibold mr-1">{comment.author.name}</span>
          <RichText text={comment.content} />
        </div>
        <button onClick={() => onReply(comment)} className="text-xs text-ink-soft font-semibold mt-1 ml-1 hover:text-ink">
          Reply
        </button>
      </div>
    </div>
  );
}

export default function ReelCommentsPanel({ reel, onClose, onCommentAdded }) {
  const [comments, setComments] = useState(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    if (!reel) return;
    setComments(null);
    setReplyTo(null);
    fetchComments(reel.id).then(setComments);
  }, [reel]);

  if (!reel) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const comment = await addComment(reel.id, text.trim(), replyTo?.id);
    setComments((prev) => [...(prev || []), comment]);
    setText('');
    setReplyTo(null);
    onCommentAdded(reel.id);
  };

  const topLevel = (comments || []).filter((c) => !c.parentId);
  const repliesByParent = (comments || []).reduce((acc, c) => {
    if (c.parentId) (acc[c.parentId] ||= []).push(c);
    return acc;
  }, {});

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
          {topLevel.map((c) => (
            <div key={c.id} className="space-y-2">
              <Comment comment={c} onReply={setReplyTo} />
              {(repliesByParent[c.id] || []).length > 0 && (
                <div className="pl-8 space-y-2">
                  {repliesByParent[c.id].map((r) => (
                    <Comment key={r.id} comment={r} onReply={() => setReplyTo(c)} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={submit} className="px-4 py-3 border-t border-line">
          {replyTo && (
            <div className="flex items-center justify-between mb-2 text-xs text-ink-soft">
              <span>
                Replying to <span className="font-semibold">{replyTo.author.name}</span>
              </span>
              <button type="button" onClick={() => setReplyTo(null)} className="hover:text-ink">
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder={replyTo ? `Reply to ${replyTo.author.name}...` : 'Add a comment...'}
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
            <button type="submit" className="text-accent font-semibold text-sm disabled:opacity-40" disabled={!text.trim()}>
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
