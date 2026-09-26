import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar';
import FollowButton from '../social/FollowButton';
import { toggleLike, toggleSave, sharePost } from '../../api/posts.api';
import { useAuthStore } from '../../store/authStore';
import { resolveMediaUrl } from '../../utils/media';

function HeartIcon({ filled }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
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
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
    </svg>
  );
}

function BookmarkIcon({ filled }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5h12a.5.5 0 0 1 .5.5v17l-6.5-4-6.5 4V4a.5.5 0 0 1 .5-.5Z" />
    </svg>
  );
}

function SpeakerIcon({ muted }) {
  return muted ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m16 9 6 6M22 9l-6 6" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
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

function ActionButton({ onClick, active, label, count, children }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 text-ink" title={`${count}`}>
      <span
        className={`h-11 w-11 rounded-full flex items-center justify-center transition-colors ${
          active ? 'bg-accent-soft text-accent' : 'bg-paper-soft hover:bg-line'
        }`}
      >
        {children}
      </span>
      <span className="text-xs font-medium text-ink-soft">{label}</span>
    </button>
  );
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
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.currentTime = 0;
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
    }
  }, [isActive]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

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

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

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
    <div className="h-full w-full flex items-center justify-center gap-6 snap-start shrink-0">
      <div className="relative h-full max-h-[85vh] aspect-[9/16] bg-black rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          src={resolveMediaUrl(reel.imageUrl)}
          loop
          playsInline
          muted={muted}
          onClick={handleDoubleTap}
          onTimeUpdate={onTimeUpdate}
          className="h-full w-full object-cover cursor-pointer"
        />

        {heartBurst && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-white animate-ping">
              <HeartIcon filled />
            </span>
          </div>
        )}

        <button
          onClick={togglePlay}
          className="absolute top-3 left-3 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          onClick={onToggleMute}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center"
          title={muted ? 'Unmute' : 'Mute'}
        >
          <SpeakerIcon muted={muted} />
        </button>

        <div className="absolute left-3 right-3 bottom-3 text-white">
          {caption && (
            <p className="text-sm drop-shadow whitespace-pre-wrap mb-2">
              {shownCaption}
              {isLong && !expanded && (
                <button onClick={() => setExpanded(true)} className="font-semibold ml-1">
                  more
                </button>
              )}
            </p>
          )}
          <div className="flex items-center gap-2.5">
            <Link to={`/profile/${reel.author.id}`}>
              <Avatar user={reel.author} size="sm" />
            </Link>
            <div className="min-w-0">
              <Link to={`/profile/${reel.author.id}`} className="font-semibold text-sm drop-shadow block truncate">
                {reel.author.name}
              </Link>
              <p className="text-xs text-white/70">{timeAgo(reel.createdAt)} ago</p>
            </div>
            {reel.author.id !== myId && reel.followedByMe !== undefined && (
              <span className="ml-auto scale-90 origin-right">
                <FollowButton profile={{ id: reel.author.id, isFollowing: reel.followedByMe }} onChange={onFollowChange} />
              </span>
            )}
          </div>
          <div className="h-[3px] bg-white/25 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-white/90" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <ActionButton onClick={handleLike} active={liked} label="Like" count={likeCount}>
          <HeartIcon filled={liked} />
        </ActionButton>
        <ActionButton onClick={() => onOpenComments(reel)} label="Comment" count={reel.commentCount}>
          <CommentIcon />
        </ActionButton>
        <ActionButton onClick={handleShare} label="Share" count={shareCount}>
          <ShareIcon />
        </ActionButton>
        <ActionButton onClick={handleSave} active={saved} label="Save" count={saveCount}>
          <BookmarkIcon filled={saved} />
        </ActionButton>
      </div>
    </div>
  );
}
