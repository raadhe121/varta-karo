import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { toggleLike, fetchComments, addComment, deletePost } from '../../api/posts.api';
import { useAuthStore } from '../../store/authStore';

function timeAgo(dateStr) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const VISIBILITY_LABEL = { public: 'Public', friends: 'Friends', only_me: 'Only me' };

export default function PostCard({ post, onDeleted }) {
  const myId = useAuthStore((s) => s.user?.id);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(post.commentCount);

  const handleLike = async () => {
    const res = await toggleLike(post.id);
    setLiked(res.liked);
    setLikeCount(res.likeCount);
  };

  const openComments = async () => {
    setCommentsOpen((open) => !open);
    if (!comments) {
      setComments(await fetchComments(post.id));
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const comment = await addComment(post.id, commentText.trim());
    setComments((prev) => [...(prev || []), comment]);
    setCommentCount((c) => c + 1);
    setCommentText('');
  };

  const handleDelete = async () => {
    await deletePost(post.id);
    onDeleted?.(post.id);
  };

  return (
    <div className="rounded-3xl bg-paper p-4 shadow-md shadow-ink/5">
      <div className="flex items-center justify-between mb-3">
        <Link to={`/profile/${post.author.id}`} className="flex items-center gap-3">
          <Avatar user={post.author} size="sm" />
          <div>
            <p className="text-sm font-semibold">{post.author.name}</p>
            <p className="text-xs text-ink-soft">
              {timeAgo(post.createdAt)} &middot; {VISIBILITY_LABEL[post.visibility]}
            </p>
          </div>
        </Link>
        {post.author.id === myId && (
          <button onClick={handleDelete} className="text-xs text-ink-soft hover:text-red-600">
            Delete
          </button>
        )}
      </div>

      {post.content && <p className="text-sm whitespace-pre-wrap mb-3">{post.content}</p>}
      {post.imageUrl &&
        (post.mediaType === 'video' ? (
          <video src={post.imageUrl} controls className="rounded-xl mb-3 max-h-96 w-full object-cover" />
        ) : (
          <img src={post.imageUrl} alt="" className="rounded-xl mb-3 max-h-96 w-full object-cover" />
        ))}

      <div className="flex items-center gap-5 text-sm text-ink-soft border-t border-line pt-3">
        <button onClick={handleLike} className={`flex items-center gap-1.5 ${liked ? 'text-accent font-semibold' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 20.5s-7.5-4.6-10-9.3C.5 8 2 4.5 5.6 4c2-.3 3.9.7 4.9 2.3.9-1.6 2.9-2.6 4.9-2.3C19 4.5 20.5 8 20 11.2c-2.5 4.7-8 9.3-8 9.3Z"
            />
          </svg>
          {likeCount > 0 && likeCount}
        </button>
        <button onClick={openComments} className="flex items-center gap-1.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
            />
          </svg>
          {commentCount > 0 && commentCount}
        </button>
      </div>

      {commentsOpen && (
        <div className="mt-3 pt-3 border-t border-line space-y-2">
          {comments?.map((c) => (
            <div key={c.id} className="flex items-start gap-2">
              <Avatar user={c.author} size="sm" />
              <div className="bg-paper-soft rounded-xl px-3 py-1.5 text-sm">
                <span className="font-semibold mr-1">{c.author.name}</span>
                {c.content}
              </div>
            </div>
          ))}
          <form onSubmit={submitComment} className="flex gap-2">
            <input
              className="input"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
          </form>
        </div>
      )}
    </div>
  );
}
