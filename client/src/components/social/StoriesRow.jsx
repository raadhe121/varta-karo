import { useEffect, useRef, useState } from 'react';
import { fetchFeedStories } from '../../api/stories.api';
import { uploadMedia } from '../../api/chat.api';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';
import StoryViewer from './StoryViewer';
import StoryComposerModal from './StoryComposerModal';

export default function StoriesRow() {
  const user = useAuthStore((s) => s.user);
  const [groups, setGroups] = useState([]);
  const [viewerGroupIndex, setViewerGroupIndex] = useState(null);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = () => fetchFeedStories().then(setGroups);

  useEffect(() => {
    load();
  }, []);

  const myGroupIndex = groups.findIndex((g) => g.author.id === user?.id);
  const myGroup = myGroupIndex >= 0 ? groups[myGroupIndex] : null;

  const handleAvatarClick = () => {
    if (myGroup) {
      setViewerGroupIndex(myGroupIndex);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      setPendingUpload({ mediaUrl: uploaded.url, mediaType: file.type.startsWith('video/') ? 'video' : 'image' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-1">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFile} />

      <button
        onClick={handleAvatarClick}
        disabled={uploading}
        title={myGroup ? 'View your story' : 'Add to your story'}
        className="flex flex-col items-center gap-1.5 shrink-0 w-16"
      >
        <div className="relative">
          <div
            className="rounded-full"
            style={
              myGroup
                ? { padding: 2, background: 'linear-gradient(135deg, #f6a93b, #c1652f)' }
                : undefined
            }
          >
            {myGroup && (
              <div className="p-[2px] rounded-full bg-paper">
                <Avatar user={user} size="md" />
              </div>
            )}
            {!myGroup && <Avatar user={user} size="md" />}
          </div>
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-accent text-white text-xs flex items-center justify-center border-2 border-paper cursor-pointer"
          >
            {uploading ? '…' : '+'}
          </span>
        </div>
        <span className="text-[11px] text-ink-soft truncate w-full text-center">Your story</span>
      </button>

      {groups
        .filter((g) => g.author.id !== user?.id)
        .map((g) => {
          const allSeen = g.stories.every((s) => s.viewedByMe);
          return (
            <button
              key={g.author.id}
              onClick={() => setViewerGroupIndex(groups.findIndex((gr) => gr.author.id === g.author.id))}
              className="flex flex-col items-center gap-1.5 shrink-0 w-16"
            >
              <div
                className="rounded-full"
                style={
                  allSeen
                    ? { padding: 2, border: '2px solid var(--color-line)' }
                    : { padding: 2, background: 'linear-gradient(135deg, #f6a93b, #c1652f)' }
                }
              >
                <div className="p-[2px] rounded-full bg-paper">
                  <Avatar user={g.author} size="md" />
                </div>
              </div>
              <span className="text-[11px] text-ink-soft truncate w-full text-center">{g.author.name.split(' ')[0]}</span>
            </button>
          );
        })}

      {viewerGroupIndex !== null && (
        <StoryViewer
          groups={groups}
          startGroupIndex={viewerGroupIndex}
          myUserId={user?.id}
          onClose={() => setViewerGroupIndex(null)}
          onStoryDeleted={load}
        />
      )}

      {pendingUpload && (
        <StoryComposerModal
          mediaUrl={pendingUpload.mediaUrl}
          mediaType={pendingUpload.mediaType}
          onClose={() => setPendingUpload(null)}
          onCreated={() => {
            setPendingUpload(null);
            load();
          }}
        />
      )}
    </div>
  );
}
