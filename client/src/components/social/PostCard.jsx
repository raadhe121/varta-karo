import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { toggleLike, fetchComments, addComment, deletePost } from '../../api/posts.api';
import { useAuthStore } from '../../store/authStore';
import { resolveMediaUrl } from '../../utils/media';
import FollowButton from './FollowButton';

function timeAgo(dateStr) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const VISIBILITY_LABEL = { public: 'Public', friends: 'Friends', only_me: 'Only me' };

export default function PostCard({ post, onDeleted, showFollowButton = false }) {
  const myId = useAuthStore((s) => s.user?.id);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [followedByMe, setFollowedByMe] = useState(post.followedByMe);

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
    <div className="rounded-xl bg-paper border border-line overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5">
        <Link to={`/profile/${post.author.id}`} className="flex items-center gap-2.5">
          <Avatar user={post.author} size="sm" />
          <div>
            <p className="text-sm font-semibold leading-tight">{post.author.name}</p>
            <p className="text-xs text-ink-soft leading-tight">
              {timeAgo(post.createdAt)} &middot; {VISIBILITY_LABEL[post.visibility]}
            </p>
          </div>
        </Link>
        {post.author.id === myId ? (
          <button onClick={handleDelete} title="Delete post" className="text-ink-soft hover:text-red-600 px-1 leading-none text-lg font-bold tracking-widest">
            ⋮
          </button>
        ) : (
          showFollowButton && (
            <FollowButton
              profile={{ id: post.author.id, isFollowing: followedByMe }}
              onChange={() => setFollowedByMe((f) => !f)}
            />
          )
        )}
      </div>

      {post.content && !post.imageUrl && <p className="text-sm whitespace-pre-wrap px-3 pb-3">{post.content}</p>}
      {post.imageUrl &&
        (post.mediaType === 'video' ? (
          <video src={resolveMediaUrl(post.imageUrl)} controls className="w-full max-h-[470px] object-cover bg-black" />
        ) : (
          <img src={resolveMediaUrl(post.imageUrl)} alt="" className="w-full max-h-[470px] object-cover" />
        ))}

      <div className="flex items-center gap-4 px-2 pt-2">
        <button onClick={handleLike} className={liked ? 'text-accent' : 'text-ink hover:text-ink-soft'}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 20.5s-7.5-4.6-10-9.3C.5 8 2 4.5 5.6 4c2-.3 3.9.7 4.9 2.3.9-1.6 2.9-2.6 4.9-2.3C19 4.5 20.5 8 20 11.2c-2.5 4.7-8 9.3-8 9.3Z"
            />
          </svg>
        </button>
        <button onClick={openComments} className="text-ink hover:text-ink-soft">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
            />
          </svg>
        </button>
      </div>

      <div className="px-3 pt-1.5 pb-1">
        <p className="text-sm font-semibold">{likeCount > 0 ? `${likeCount} ${likeCount === 1 ? 'like' : 'likes'}` : 'Be the first to like this'}</p>
      </div>

      {post.content && post.imageUrl && (
        <p className="text-sm px-3 pb-1 whitespace-pre-wrap">
          <span className="font-semibold mr-1">{post.author.name}</span>
          {post.content}
        </p>
      )}

      {!commentsOpen && commentCount > 0 && (
        <button onClick={openComments} className="text-sm text-ink-soft px-3 pb-3 block">
          View all {commentCount} comments
        </button>
      )}
      {(commentsOpen || commentCount === 0) && <div className="pb-3" />}

      {commentsOpen && (
        <div className="px-3 pb-3 border-t border-line pt-3 space-y-2">
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
