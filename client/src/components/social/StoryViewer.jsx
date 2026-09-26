import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import { viewStory, deleteStory, fetchStoryViewers } from '../../api/stories.api';
import { createConversation } from '../../api/chat.api';
import { getSocket } from '../../socket/socket';
import { useChatStore } from '../../store/chatStore';
import { resolveMediaUrl } from '../../utils/media';

const IMAGE_DURATION = 5000;

function timeAgo(dateStr) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  return `${Math.floor(diffMin / 60)}h`;
}

export default function StoryViewer({ groups, startGroupIndex, myUserId, onClose, onStoryDeleted }) {
  const navigate = useNavigate();
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [viewers, setViewers] = useState(null);
  const [showViewers, setShowViewers] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);
  const videoRef = useRef(null);
  const rafRef = useRef(null);
  const typingRef = useRef(false);
  const pauseStartRef = useRef(null);
  const pausedDurationRef = useRef(0);
  const startRef = useRef(0);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const isMine = story?.authorId === myUserId;

  const goNext = useCallback(() => {
    setShowViewers(false);
    setViewers(null);
    setReplySent(false);
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((g) => g + 1);
      setStoryIndex(0);
    } else {
      onClose();
    }
  }, [group, storyIndex, groupIndex, groups.length, onClose]);

  const goPrev = useCallback(() => {
    setShowViewers(false);
    setViewers(null);
    setReplySent(false);
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      setStoryIndex(groups[groupIndex - 1].stories.length - 1);
      setGroupIndex((g) => g - 1);
    } else {
      onClose();
    }
  }, [storyIndex, groupIndex, groups, onClose]);

  useEffect(() => {
    if (story && !isMine && !story.viewedByMe) {
      viewStory(story.id).catch(() => {});
    }
  }, [story, isMine]);

  useEffect(() => {
    setProgress(0);
    cancelAnimationFrame(rafRef.current);
    if (!story || story.mediaType === 'video') return undefined;

    startRef.current = performance.now();
    pausedDurationRef.current = 0;
    pauseStartRef.current = null;

    const tick = (now) => {
      if (typingRef.current) {
        if (pauseStartRef.current === null) pauseStartRef.current = now;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (pauseStartRef.current !== null) {
        pausedDurationRef.current += now - pauseStartRef.current;
        pauseStartRef.current = null;
      }
      const elapsed = now - startRef.current - pausedDurationRef.current;
      const pct = Math.min(100, (elapsed / IMAGE_DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) {
        goNext();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  useEffect(() => {
    const onKey = (e) => {
      if (typingRef.current) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  const handleVideoTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  const openViewers = async () => {
    setShowViewers((s) => !s);
    if (!viewers) setViewers(await fetchStoryViewers(story.id));
  };

  const handleDelete = async () => {
    await deleteStory(story.id);
    onStoryDeleted(story.id);
    onClose();
  };

  const setTyping = (value) => {
    typingRef.current = value;
    videoRef.current?.[value ? 'pause' : 'play']?.();
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const conversation = await createConversation({ type: 'direct', participantIds: [group.author.id] });
    upsertConversation(conversation);
    const socket = getSocket();
    socket?.emit('message:send', {
      conversationId: conversation.id,
      type: 'text',
      content: `Replied to your story: ${replyText.trim()}`,
    });
    setReplyText('');
    setReplySent(true);
    setTyping(false);
  };

  const openConversation = () => {
    createConversation({ type: 'direct', participantIds: [group.author.id] }).then((conversation) => {
      upsertConversation(conversation);
      setActiveConversation(conversation.id);
      navigate('/chat');
    });
  };

  if (!group || !story) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full max-w-sm h-full sm:h-[90vh] sm:rounded-2xl overflow-hidden bg-paper-dark">
        <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white"
                style={{ width: `${i < storyIndex ? 100 : i === storyIndex ? progress : 0}%` }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-6 left-3 right-3 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar user={group.author} size="sm" />
            <span className="text-white text-sm font-semibold">{group.author.name}</span>
            <span className="text-white/70 text-xs">{timeAgo(story.createdAt)}</span>
          </div>
          <div className="flex items-center gap-3">
            {isMine && (
              <button onClick={handleDelete} className="text-white/80 text-sm">
                Delete
              </button>
            )}
            <button onClick={onClose} className="text-white text-xl leading-none">
              &times;
            </button>
          </div>
        </div>

        {story.mediaType === 'video' ? (
          <video
            key={story.id}
            ref={videoRef}
            src={resolveMediaUrl(story.mediaUrl)}
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-black"
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={goNext}
          />
        ) : (
          <img key={story.id} src={resolveMediaUrl(story.mediaUrl)} alt="" className="w-full h-full object-contain bg-black" />
        )}

        {story.caption && (
          <p className="absolute bottom-24 left-3 right-3 z-20 text-white text-sm bg-black/30 rounded-lg px-3 py-2">
            {story.caption}
          </p>
        )}

        {isMine && (
          <button
            onClick={openViewers}
            className="absolute bottom-3 left-3 z-20 text-white text-xs flex items-center gap-1"
          >
            👁 Viewers{viewers ? ` (${viewers.length})` : ''}
          </button>
        )}

        {!isMine && (
          <form onSubmit={submitReply} className="absolute bottom-3 left-3 right-3 z-20 flex items-center gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setTyping(true)}
              onBlur={() => !replyText && setTyping(false)}
              placeholder={`Reply to ${group.author.name}...`}
              className="flex-1 bg-black/40 border border-white/30 rounded-full px-4 py-2 text-sm text-white placeholder:text-white/60 outline-none focus:border-white"
            />
            {replyText ? (
              <button type="submit" className="text-white shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                </svg>
              </button>
            ) : (
              <button type="button" onClick={openConversation} title="Send a message" className="text-white shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8c-1.1 0-2.2-.2-3.1-.6L4 20l1.1-4.4C4.4 14.5 4 13.3 4 12Z"
                  />
                </svg>
              </button>
            )}
          </form>
        )}
        {replySent && (
          <p className="absolute bottom-14 left-3 z-20 text-white/80 text-xs">Reply sent.</p>
        )}

        {showViewers && (
          <div className="absolute bottom-0 left-0 right-0 max-h-64 overflow-y-auto bg-paper-dark/95 rounded-t-2xl p-4 z-30">
            <p className="text-white text-xs uppercase tracking-wide mb-2">Viewers</p>
            {viewers === null ? (
              <p className="text-white/60 text-sm">Loading...</p>
            ) : viewers.length === 0 ? (
              <p className="text-white/60 text-sm">No views yet.</p>
            ) : (
              viewers.map((v) => (
                <div key={v.id} className="flex items-center gap-2 py-1.5">
                  <Avatar user={v} size="sm" />
                  <span className="text-white text-sm">{v.name}</span>
                </div>
              ))
            )}
          </div>
        )}

        <button aria-label="Previous" onClick={goPrev} className="absolute left-0 top-0 h-1/3 w-1/3 z-10" />
        <button aria-label="Next" onClick={goNext} className="absolute right-0 top-0 h-1/3 w-1/3 z-10" />
      </div>
    </div>
  );
}
