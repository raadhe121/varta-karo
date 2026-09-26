import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import RichText from '../common/RichText';
import { toggleLike, toggleSave, fetchComments, addComment, deletePost, sharePost } from '../../api/posts.api';
import { fetchConversations } from '../../api/chat.api';
import { getSocket } from '../../socket/socket';
import { useAuthStore } from '../../store/authStore';
import { resolveMediaUrl } from '../../utils/media';
import FollowButton from './FollowButton';
import SaveToCollectionModal from './SaveToCollectionModal';

// Instagram-style feed video: no native control bar (no scrubber, timer,
// fullscreen/volume/menu buttons) -- just the video, muted+looping by
// default, tap anywhere to play/pause, tap the speaker to unmute, with a
// thin scrub-less progress bar along the bottom edge.
function FeedVideo({ src }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  return (
    <div className="relative bg-black">
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        onClick={togglePlay}
        onTimeUpdate={onTimeUpdate}
        className="w-full max-h-[470px] object-cover cursor-pointer"
      />
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="h-14 w-14 rounded-full bg-black/40 flex items-center justify-center text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/25">
        <div className="h-full bg-white/90" style={{ width: `${progress}%` }} />
      </div>
      <button
        onClick={toggleMute}
        className="absolute bottom-3 right-3 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center"
      >
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path strokeLinecap="round" d="m16 9 5 6M21 9l-5 6" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path strokeLinecap="round" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
          </svg>
        )}
      </button>
    </div>
  );
}

// Renders a post's `media` array -- a single item shows as before, 2+ items
// become a swipeable carousel with dot indicators and prev/next arrows.
function PostMedia({ media }) {
  const [index, setIndex] = useState(0);
  if (!media || media.length === 0) return null;

  const item = media[index];
  const go = (delta) => setIndex((i) => Math.max(0, Math.min(media.length - 1, i + delta)));

  return (
    <div className="relative">
      {item.mediaType === 'video' ? (
        <FeedVideo src={resolveMediaUrl(item.url)} />
      ) : (
        <img src={resolveMediaUrl(item.url)} alt="" className="w-full max-h-[470px] object-cover" />
      )}
      {media.length > 1 && (
        <>
          {index > 0 && (
            <button
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          {index < media.length - 1 && (
            <button
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}
          <div className="absolute top-3 right-3 bg-black/40 text-white text-xs font-semibold rounded-full px-2 py-0.5">
            {index + 1}/{media.length}
          </div>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {media.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ShareModal({ post, onClose, onShared }) {
  const [conversations, setConversations] = useState(null);
  const [sentTo, setSentTo] = useState(null);

  useEffect(() => {
    fetchConversations().then(setConversations);
  }, []);

  const shareToConversation = (conversationId) => {
    const socket = getSocket();
    const link = `${window.location.origin}/profile/${post.author.id}`;
    socket?.emit('message:send', {
      conversationId,
      type: 'text',
      content: `Shared ${post.author.name}'s post${post.content ? `: "${post.content.slice(0, 60)}"` : ''} ${link}`,
    });
    sharePost(post.id);
    setSentTo(conversationId);
    onShared?.();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-paper rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <p className="font-semibold">Share to</p>
          <button onClick={onClose} className="text-ink-soft text-xl leading-none">
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations === null ? (
            <p className="text-sm text-ink-soft text-center py-6">Loading...</p>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-ink-soft text-center py-6">Follow each other with someone to share posts via chat.</p>
          ) : (
            conversations.map((c) => {
              const other = c.type === 'direct' ? c.participants.find((p) => p.id !== post.author.id) : null;
              const label = c.type === 'group' ? c.name : other?.name || 'Conversation';
              return (
                <button
                  key={c.id}
                  onClick={() => shareToConversation(c.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-paper-soft text-left"
                >
                  <Avatar user={c.type === 'group' ? { name: c.name } : other} size="sm" />
                  <span className="flex-1 text-sm font-medium truncate">{label}</span>
                  {sentTo === c.id && <span className="text-xs text-accent font-semibold">Sent</span>}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function timeAgo(dateStr) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const VISIBILITY_LABEL = { public: 'Public', friends: 'Friends', only_me: 'Only me' };

function HeartIcon({ filled }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 20.5s-7.5-4.6-10-9.3C.5 8 2 4.5 5.6 4c2-.3 3.9.7 4.9 2.3.9-1.6 2.9-2.6 4.9-2.3C19 4.5 20.5 8 20 11.2c-2.5 4.7-8 9.3-8 9.3Z"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
    </svg>
  );
}

function BookmarkIcon({ filled }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4.5L5 21V4.5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9Z" />
    </svg>
  );
}

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

export default function PostCard({ post, onDeleted, showFollowButton = false, allowDelete = false }) {
  const me = useAuthStore((s) => s.user);
  const myId = me?.id;
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(post.savedByMe);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [followedByMe, setFollowedByMe] = useState(post.followedByMe);
  const [menuOpen, setMenuOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const media = post.media?.length > 0 ? post.media : post.imageUrl ? [{ url: post.imageUrl, mediaType: post.mediaType }] : [];

  const handleLike = async () => {
    const res = await toggleLike(post.id);
    setLiked(res.liked);
    setLikeCount(res.likeCount);
  };

  const handleSaveClick = async () => {
    if (saved) {
      const res = await toggleSave(post.id);
      setSaved(res.saved);
      return;
    }
    setSaveModalOpen(true);
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
    const comment = await addComment(post.id, commentText.trim(), replyTo?.id);
    setComments((prev) => [...(prev || []), comment]);
    setCommentCount((c) => c + 1);
    setCommentText('');
    setCommentsOpen(true);
    setReplyTo(null);
  };

  const handleDelete = async () => {
    setMenuOpen(false);
    await deletePost(post.id);
    onDeleted?.(post.id);
  };

  const topLevelComments = (comments || []).filter((c) => !c.parentId);
  const repliesByParent = (comments || []).reduce((acc, c) => {
    if (c.parentId) (acc[c.parentId] ||= []).push(c);
    return acc;
  }, {});

  return (
    <div className="bg-paper border-b border-line overflow-hidden lg:rounded-2xl lg:border lg:mb-0">
      {saveModalOpen && (
        <SaveToCollectionModal
          postId={post.id}
          onClose={() => setSaveModalOpen(false)}
          onSaved={() => {
            setSaved(true);
            setSaveModalOpen(false);
          }}
        />
      )}
      {shareModalOpen && <ShareModal post={post} onClose={() => setShareModalOpen(false)} />}

      <div className="flex items-center justify-between px-4 py-3">
        <Link to={`/profile/${post.author.id}`} className="flex items-center gap-2.5">
          <Avatar user={post.author} size="sm" />
          <div>
            <p className="text-sm font-semibold leading-tight">{post.author.name}</p>
            <p className="text-xs text-ink-soft leading-tight flex items-center gap-1">
              {timeAgo(post.createdAt)} &middot; <GlobeIcon /> {VISIBILITY_LABEL[post.visibility]}
            </p>
          </div>
        </Link>
        {post.author.id === myId && allowDelete ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              title="Post options"
              className="text-ink-soft hover:text-ink px-1 leading-none text-lg font-bold tracking-widest"
            >
              ⋮
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 rounded-lg border border-line bg-paper shadow-lg shadow-ink/10 overflow-hidden min-w-[120px]">
                  <button
                    onClick={handleDelete}
                    className="w-full text-left px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          post.author.id !== myId &&
          showFollowButton && (
            <FollowButton
              profile={{ id: post.author.id, isFollowing: followedByMe }}
              onChange={() => setFollowedByMe((f) => !f)}
            />
          )
        )}
      </div>

      {post.content && media.length === 0 && (
        <p className="text-sm whitespace-pre-wrap px-4 pb-3">
          <RichText text={post.content} />
        </p>
      )}
      <PostMedia media={media} />

      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <div className="flex items-center gap-4 lg:gap-5">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm font-medium ${liked ? 'text-accent' : 'text-ink hover:text-ink-soft'}`}
          >
            <HeartIcon filled={liked} />
            <span className="hidden lg:inline">Like</span>
          </button>
          <button onClick={openComments} className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-ink-soft">
            <CommentIcon />
            <span className="hidden lg:inline">Comment</span>
          </button>
          <button
            onClick={() => setShareModalOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-ink hover:text-ink-soft"
          >
            <ShareIcon />
            <span className="hidden lg:inline">Share</span>
          </button>
        </div>
        <button onClick={handleSaveClick} className={saved ? 'text-accent' : 'text-ink hover:text-ink-soft'}>
          <BookmarkIcon filled={saved} />
        </button>
      </div>

      <div className="px-4 pb-1">
        <p className="text-sm font-semibold">{likeCount > 0 ? `${likeCount} ${likeCount === 1 ? 'like' : 'likes'}` : 'Be the first to like this'}</p>
      </div>

      {post.content && media.length > 0 && (
        <p className="text-sm px-4 pb-1 whitespace-pre-wrap">
          <span className="font-semibold mr-1">{post.author.name}</span>
          <RichText text={post.content} />
        </p>
      )}

      {!commentsOpen && commentCount > 0 && (
        <button onClick={openComments} className="text-sm text-ink-soft px-4 pb-2 block">
          View all {commentCount} comments
        </button>
      )}

      {commentsOpen && topLevelComments.length > 0 && (
        <div className="px-4 pb-2 space-y-3">
          {topLevelComments.map((c) => (
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
      )}

      <form onSubmit={submitComment} className="px-4 py-3 border-t border-line">
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
        <div className="flex items-center gap-2">
          <Avatar user={me} size="sm" />
          <input
            className="flex-1 rounded-full bg-page border border-line px-4 py-2 text-sm outline-none focus:border-accent"
            placeholder={replyTo ? `Reply to ${replyTo.author.name}...` : 'Be the first to comment...'}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </div>
      </form>
    </div>
  );
}
