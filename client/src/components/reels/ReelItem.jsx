import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import FollowButton from '../social/FollowButton';
import { toggleLike, toggleSave, sharePost } from '../../api/posts.api';
import { useAuthStore } from '../../store/authStore';
import { resolveMediaUrl } from '../../utils/media';

function HeartIcon({ filled }) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
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
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 12 18-8-8 18-2.5-7.5L3 12Z" />
    </svg>
  );
}

function BookmarkIcon({ filled }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5h12a.5.5 0 0 1 .5.5v17l-6.5-4-6.5 4V4a.5.5 0 0 1 .5-.5Z" />
    </svg>
  );
}

function SpeakerIcon({ muted }) {
  return muted ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m16 9 6 6M22 9l-6 6" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function timeAgo(dateStr) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ReelItem({ reel, isActive, muted, onToggleMute, onOpenComments, onFollowChange }) {
  const myId = useAuthStore((s) => s.user?.id);
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(reel.likedByMe);
  const [likeCount, setLikeCount] = useState(reel.likeCount);
  const [saved, setSaved] = useState(reel.savedByMe);
  const [saveCount, setSaveCount] = useState(reel.saveCount);
  const [shareCount, setShareCount] = useState(reel.shareCount);
  const [expanded, setExpanded] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const handleLike = async () => {
    const res = await toggleLike(reel.id);
    setLiked(res.liked);
    setLikeCount(res.likeCount);
  };

  const handleDoubleTap = () => {
    if (!liked) handleLike();
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 700);
  };

  const handleSave = async () => {
    const res = await toggleSave(reel.id);
    setSaved(res.saved);
    setSaveCount(res.saveCount);
  };

  const handleShare = async () => {
    const res = await sharePost(reel.id);
    setShareCount(res.shareCount);
  };

  const caption = reel.content || '';
  const isLong = caption.length > 80;
  const shownCaption = expanded || !isLong ? caption : `${caption.slice(0, 80)}...`;

  return (
    <div className="relative h-full w-full flex items-center justify-center snap-start shrink-0 bg-ink">
      <video
        ref={videoRef}
        src={resolveMediaUrl(reel.imageUrl)}
        loop
        playsInline
        muted={muted}
        onClick={handleDoubleTap}
        className="h-full w-full object-contain bg-black cursor-pointer"
      />

      {heartBurst && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-white animate-ping">
            <HeartIcon filled />
          </span>
        </div>
      )}

      <button
        onClick={onToggleMute}
        className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/40 text-white flex items-center justify-center"
        title={muted ? 'Unmute' : 'Mute'}
      >
        <SpeakerIcon muted={muted} />
      </button>

      <div className="absolute left-4 right-20 bottom-6 text-white">
        <Link to={`/profile/${reel.author.id}`} className="flex items-center gap-2.5 mb-2">
          <Avatar user={reel.author} size="sm" />
          <span className="font-semibold text-sm drop-shadow">{reel.author.name}</span>
          {reel.author.id !== myId && reel.followedByMe !== undefined && (
            <span className="scale-90 origin-left">
              <FollowButton profile={{ id: reel.author.id, isFollowing: reel.followedByMe }} onChange={onFollowChange} />
            </span>
          )}
        </Link>
        {caption && (
          <p className="text-sm drop-shadow whitespace-pre-wrap">
            {shownCaption}
            {isLong && !expanded && (
              <button onClick={() => setExpanded(true)} className="font-semibold ml-1">
                more
              </button>
            )}
          </p>
        )}
        <p className="text-xs text-white/60 mt-1">{timeAgo(reel.createdAt)} ago</p>
      </div>

      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 text-white">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <span className={liked ? 'text-red-500' : ''}>
            <HeartIcon filled={liked} />
          </span>
          <span className="text-xs font-semibold drop-shadow">{likeCount}</span>
        </button>
        <button onClick={() => onOpenComments(reel)} className="flex flex-col items-center gap-1">
          <CommentIcon />
          <span className="text-xs font-semibold drop-shadow">{reel.commentCount}</span>
        </button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <ShareIcon />
          <span className="text-xs font-semibold drop-shadow">{shareCount}</span>
        </button>
        <button onClick={handleSave} className="flex flex-col items-center gap-1">
          <span className={saved ? 'text-accent' : ''}>
            <BookmarkIcon filled={saved} />
          </span>
          <span className="text-xs font-semibold drop-shadow">{saveCount}</span>
        </button>
      </div>
    </div>
  );
}
