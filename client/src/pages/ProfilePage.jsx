import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useSocket } from '../hooks/useSocket';
import { fetchProfile } from '../api/social.api';
import { fetchUserPosts } from '../api/posts.api';
import { updateMe } from '../api/users.api';
import { createConversation, uploadMedia } from '../api/chat.api';
import IncomingCallModal from '../components/call/IncomingCallModal';
import ActiveCallOverlay from '../components/call/ActiveCallOverlay';
import HomeTopBar from '../components/layout/HomeTopBar';
import FeedSidebar from '../components/layout/FeedSidebar';
import MobileTabBar from '../components/layout/MobileTabBar';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import FollowButton from '../components/social/FollowButton';
import FollowListModal from '../components/social/FollowListModal';
import PostCard from '../components/social/PostCard';
import ActivityLog from '../components/social/ActivityLog';
import CreatePostModal from '../components/social/CreatePostModal';
import StoryComposerModal from '../components/social/StoryComposerModal';
import { resolveMediaUrl } from '../utils/media';

function LocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}
function WorkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function EducationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 9.5 12 5l10 4.5-10 4.5-10-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

export default function ProfilePage() {
  useSocket();
  const { userId } = useParams();
  const myId = useAuthStore((s) => s.user?.id);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const navigate = useNavigate();

  const targetId = userId || myId;
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('posts');
  const [posts, setPosts] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [followListType, setFollowListType] = useState(null); // 'followers' | 'following' | null
  const [composerOpen, setComposerOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [pendingStory, setPendingStory] = useState(null);
  const [storyUploading, setStoryUploading] = useState(false);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const storyInputRef = useRef(null);

  const load = () => fetchProfile(targetId).then(setProfile);

  useEffect(() => {
    setProfile(null);
    setPosts(null);
    setTab('posts');
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  useEffect(() => {
    if ((tab === 'posts' || tab === 'media') && profile) {
      fetchUserPosts(targetId).then(setPosts);
    }
  }, [tab, profile, targetId]);

  const mediaPosts = (posts || []).filter((p) => p.imageUrl);
  const isMutual = profile?.isFollowing && profile?.isFollowedBy;
  const canSeeFollowLists = profile?.isSelf || isMutual;

  const startChat = async () => {
    setChatLoading(true);
    try {
      const conversation = await createConversation({ type: 'direct', participantIds: [profile.id] });
      upsertConversation(conversation);
      setActiveConversation(conversation.id);
      navigate('/chat');
    } finally {
      setChatLoading(false);
    }
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      const updated = await updateMe({ avatarUrl: uploaded.url });
      setProfile((p) => ({ ...p, avatarUrl: updated.avatarUrl }));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCoverUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      const updated = await updateMe({ coverPhotoUrl: uploaded.url });
      setProfile((p) => ({ ...p, coverPhotoUrl: updated.coverPhotoUrl }));
    } finally {
      setCoverUploading(false);
    }
  };

  const handleStoryFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setStoryUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      setPendingStory({ mediaUrl: uploaded.url, mediaType: file.type.startsWith('video/') ? 'video' : 'image' });
    } finally {
      setStoryUploading(false);
    }
  };

  const copyProfileLink = () => {
    navigator.clipboard?.writeText(`${window.location.origin}/profile/${profile.id}`);
  };

  const checklist = profile?.isSelf
    ? [
        { key: 'photo', label: 'Add a profile photo', done: Boolean(profile.avatarUrl), onClick: () => avatarInputRef.current?.click() },
        { key: 'cover', label: 'Add a cover photo', done: Boolean(profile.coverPhotoUrl), onClick: () => coverInputRef.current?.click() },
        { key: 'bio', label: 'Write a short bio', done: Boolean(profile.bio), onClick: () => navigate('/settings') },
        { key: 'post', label: 'Share your first post', done: (posts || []).length > 0, onClick: () => setComposerOpen(true) },
      ]
    : [];
  const checklistDoneCount = checklist.filter((c) => c.done).length;

  const shell = (children) => (
    <div className="min-h-screen flex flex-col bg-page">
      <IncomingCallModal />
      <ActiveCallOverlay />
      <HomeTopBar onCreate={() => setComposerOpen(true)} />
      <FeedSidebar />
      <div className="flex-1 flex justify-center gap-8 px-0 lg:pl-64 lg:pr-6 py-0 lg:py-6">
        <main className="flex-1 max-w-[1180px] pb-16 lg:pb-0">{children}</main>
      </div>
      <MobileTabBar onCreate={() => setComposerOpen(true)} />
    </div>
  );

  if (!profile) {
    return shell(
      <div className="px-4 lg:px-0">
        <div className="h-36 sm:h-56 w-full rounded-3xl bg-gradient-to-br from-accent-soft to-paper-soft animate-pulse" />
        <div className="flex items-end justify-between -mt-14 relative z-10 px-4">
          <div className="h-28 w-28 rounded-full ring-4 ring-page bg-line animate-pulse" />
          <div className="h-9 w-28 mb-2 rounded-xl bg-paper-soft animate-pulse" />
        </div>
        <div className="mt-4 px-4 space-y-2">
          <div className="h-6 w-48 rounded bg-paper-soft animate-pulse" />
          <div className="h-4 w-32 rounded bg-paper-soft animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 mt-6 px-4">
          <div className="h-40 rounded-2xl bg-paper-soft animate-pulse" />
          <div className="space-y-3">
            <div className="h-24 rounded-2xl bg-paper-soft animate-pulse" />
            <div className="h-24 rounded-2xl bg-paper-soft animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return shell(
    <>
      {composerOpen && (
        <CreatePostModal
          onClose={() => setComposerOpen(false)}
          onCreated={(post) => {
            setPosts((prev) => (prev ? [post, ...prev] : prev));
            setComposerOpen(false);
          }}
        />
      )}
      {pendingStory && (
        <StoryComposerModal
          mediaUrl={pendingStory.mediaUrl}
          mediaType={pendingStory.mediaType}
          onClose={() => setPendingStory(null)}
          onCreated={() => setPendingStory(null)}
        />
      )}
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarFile} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverFile} />
      <input type="file" ref={storyInputRef} className="hidden" accept="image/*,video/*" onChange={handleStoryFile} />

      <div className="px-4 lg:px-0">
        <div className="relative h-36 sm:h-56 w-full rounded-3xl bg-gradient-to-br from-[#4c3a8f] to-[#241a4d] overflow-hidden">
          {profile.coverPhotoUrl ? (
            <img src={resolveMediaUrl(profile.coverPhotoUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <>
              <div className="absolute -top-16 -right-10 h-72 w-72 rounded-full border border-white/10" />
              <div className="absolute -top-6 right-10 h-56 w-56 rounded-full border border-white/10" />
              <div className="absolute top-10 right-32 h-32 w-32 rounded-full border border-white/10" />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 h-9 w-9 rounded-full bg-black/30 hover:bg-black/45 text-white flex items-center justify-center backdrop-blur-sm"
          >
            &larr;
          </button>
          {profile.isSelf && (
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-xl bg-black/50 hover:bg-black/60 text-white text-sm font-medium px-3.5 py-2 backdrop-blur-sm"
            >
              <CameraIcon />
              {coverUploading ? 'Uploading...' : 'Add cover photo'}
            </button>
          )}
        </div>

        <div className="flex items-end justify-between flex-wrap gap-y-2 relative z-10">
          <div className="relative -mt-14 shrink-0">
            <div className="rounded-full ring-4 ring-page shadow-lg">
              <Avatar user={profile} size="lg" />
            </div>
            {profile.isSelf && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-paper-dark text-white flex items-center justify-center border-2 border-page"
              >
                <CameraIcon />
              </button>
            )}
          </div>
          {profile.isSelf ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Button className="text-sm" onClick={() => navigate('/settings')}>
                <span className="mr-1">&#9998;</span> Edit profile
              </Button>
              <Button variant="outline" className="text-sm" onClick={() => storyInputRef.current?.click()} disabled={storyUploading}>
                <span className="mr-1">+</span> {storyUploading ? 'Uploading...' : 'Add story'}
              </Button>
              <button
                onClick={copyProfileLink}
                title="Copy profile link"
                className="h-9 w-9 rounded-xl border border-line flex items-center justify-center text-ink-soft hover:bg-paper-soft shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              <FollowButton profile={profile} onChange={load} />
              {isMutual && (
                <Button className="text-sm" disabled={chatLoading} onClick={startChat}>
                  {chatLoading ? 'Opening...' : '💬 Chat'}
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-3xl font-bold">{profile.name}</h1>
            {isMutual && (
              <span className="text-[11px] font-semibold text-accent bg-accent-soft rounded-full px-2.5 py-0.5">
                Following each other
              </span>
            )}
          </div>
          <p className="text-sm text-ink-soft mt-1 flex items-center gap-1.5 flex-wrap">
            <span>@{profile.username}</span>
            <span>&middot;</span>
            {canSeeFollowLists ? (
              <button onClick={() => setFollowListType('followers')} className="hover:underline">
                <strong className="text-ink">{profile.followerCount}</strong> follower{profile.followerCount === 1 ? '' : 's'}
              </button>
            ) : (
              <span>
                <strong className="text-ink">{profile.followerCount}</strong> follower{profile.followerCount === 1 ? '' : 's'}
              </span>
            )}
            <span>&middot;</span>
            {canSeeFollowLists ? (
              <button onClick={() => setFollowListType('following')} className="hover:underline">
                <strong className="text-ink">{profile.followingCount}</strong> following
              </button>
            ) : (
              <span>
                <strong className="text-ink">{profile.followingCount}</strong> following
              </span>
            )}
          </p>
          {profile.bio && <p className="text-sm mt-2.5 max-w-md leading-relaxed">{profile.bio}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 mt-6">
          <div className="space-y-4">
            <div className="rounded-2xl bg-paper border border-line p-5">
              <p className="font-display font-semibold text-lg mb-1">About</p>
              {profile.about === null ? (
                <p className="text-sm text-ink-soft">This person's info is private.</p>
              ) : profile.about.work || profile.about.education || profile.about.location || (profile.about.links || []).length > 0 ? (
                <div className="space-y-2.5 text-sm mt-3">
                  {profile.about.work && (
                    <p className="flex items-center gap-2.5 text-ink-soft">
                      <WorkIcon /> <span className="text-ink">{profile.about.work}</span>
                    </p>
                  )}
                  {profile.about.education && (
                    <p className="flex items-center gap-2.5 text-ink-soft">
                      <EducationIcon /> <span className="text-ink">{profile.about.education}</span>
                    </p>
                  )}
                  {profile.about.location && (
                    <p className="flex items-center gap-2.5 text-ink-soft">
                      <LocationIcon /> <span className="text-ink">{profile.about.location}</span>
                    </p>
                  )}
                  {(profile.about.links || []).map((l) => (
                    <p key={l.url} className="flex items-center gap-2.5">
                      🔗{' '}
                      <a href={l.url} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
                        {l.label}
                      </a>
                    </p>
                  ))}
                </div>
              ) : profile.isSelf ? (
                <>
                  <p className="text-sm text-ink-soft mt-2 mb-4">Tell people a little about yourself &mdash; it helps friends find you.</p>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full rounded-xl bg-accent-soft text-accent font-semibold text-sm py-2.5 mb-4 hover:brightness-105 transition-[filter]"
                  >
                    Add a bio
                  </button>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full flex items-center gap-2.5 text-sm text-ink-soft hover:bg-paper-soft rounded-lg px-2 py-2 -mx-2"
                    >
                      <LocationIcon /> Add where you live
                    </button>
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full flex items-center gap-2.5 text-sm text-ink-soft hover:bg-paper-soft rounded-lg px-2 py-2 -mx-2"
                    >
                      <WorkIcon /> Add work
                    </button>
                    <button
                      onClick={() => navigate('/settings')}
                      className="w-full flex items-center gap-2.5 text-sm text-ink-soft hover:bg-paper-soft rounded-lg px-2 py-2 -mx-2"
                    >
                      <EducationIcon /> Add education
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-ink-soft mt-2">Nothing added yet.</p>
              )}
            </div>

            {mediaPosts.length > 0 && (
              <div className="rounded-2xl bg-paper border border-line p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-wide font-semibold text-ink-soft">Visual Journal</p>
                  <button onClick={() => setTab('media')} className="text-xs text-accent font-medium hover:underline">
                    View all
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {mediaPosts.slice(0, 6).map((p) => (
                    <img
                      key={p.id}
                      src={resolveMediaUrl(p.imageUrl)}
                      alt=""
                      className="aspect-square rounded-lg object-cover hover:opacity-90 transition-opacity cursor-pointer"
                      onClick={() => setTab('media')}
                    />
                  ))}
                </div>
              </div>
            )}

            {checklist.length > 0 && checklistDoneCount < checklist.length && (
              <div className="rounded-2xl bg-paper border border-line p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-display font-semibold text-lg">Finish your profile</p>
                  <span className="text-xs text-ink-soft">{checklistDoneCount} of {checklist.length}</span>
                </div>
                <div className="h-1.5 rounded-full bg-line overflow-hidden mb-4">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${(checklistDoneCount / checklist.length) * 100}%` }}
                  />
                </div>
                <div className="space-y-2.5">
                  {checklist.map((item) => (
                    <button
                      key={item.key}
                      onClick={item.done ? undefined : item.onClick}
                      disabled={item.done}
                      className="w-full flex items-center gap-2.5 text-sm text-left"
                    >
                      <span
                        className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center text-[9px] ${
                          item.done ? 'bg-accent border-accent text-white' : 'border-line'
                        }`}
                      >
                        {item.done && '✓'}
                      </span>
                      <span className={item.done ? 'text-ink-soft line-through' : 'text-ink'}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex gap-1 border-b border-line">
              <button
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  tab === 'posts' ? 'border-accent text-accent' : 'border-transparent text-ink-soft hover:text-ink'
                }`}
                onClick={() => setTab('posts')}
              >
                Timeline
              </button>
              <button
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  tab === 'media' ? 'border-accent text-accent' : 'border-transparent text-ink-soft hover:text-ink'
                }`}
                onClick={() => setTab('media')}
              >
                Media
              </button>
              {profile.isSelf && (
                <button
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    tab === 'activity' ? 'border-accent text-accent' : 'border-transparent text-ink-soft hover:text-ink'
                  }`}
                  onClick={() => setTab('activity')}
                >
                  Activity
                </button>
              )}
            </div>

            <div className="py-5 pb-12 space-y-3">
              {tab === 'posts' &&
                (posts === null ? (
                  <div className="space-y-3">
                    {[0, 1].map((i) => (
                      <div key={i} className="h-28 rounded-2xl bg-paper-soft animate-pulse" />
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="rounded-2xl bg-paper border border-line p-10 text-center">
                    <div className="h-14 w-14 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto mb-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <circle cx="9" cy="10.5" r="1.6" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 17 5-4.5 3.5 3L18 11l3 3" />
                      </svg>
                    </div>
                    <p className="font-display font-semibold text-lg mb-1">No posts yet</p>
                    <p className="text-sm text-ink-soft max-w-sm mx-auto">
                      {profile.isSelf
                        ? 'Share a photo, video or a thought. Your posts will show up here for your followers.'
                        : `${profile.name} hasn't posted anything yet.`}
                    </p>
                    {profile.isSelf && (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <Button onClick={() => setComposerOpen(true)}>Create your first post</Button>
                        <Button variant="outline" onClick={() => storyInputRef.current?.click()} disabled={storyUploading}>
                          {storyUploading ? 'Uploading...' : 'Add story'}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      allowDelete
                      onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
                    />
                  ))
                ))}
              {tab === 'media' &&
                (mediaPosts.length === 0 ? (
                  <div className="rounded-2xl bg-paper border border-line p-10 text-center">
                    <p className="text-3xl mb-2">🖼️</p>
                    <p className="text-sm text-ink-soft">No photos yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {mediaPosts.map((p) => (
                      <img
                        key={p.id}
                        src={resolveMediaUrl(p.imageUrl)}
                        alt=""
                        className="aspect-square rounded-xl object-cover hover:opacity-90 transition-opacity"
                      />
                    ))}
                  </div>
                ))}
              {tab === 'activity' && <ActivityLog />}
            </div>
          </div>
        </div>
      </div>

      <FollowListModal
        open={followListType !== null}
        onClose={() => setFollowListType(null)}
        userId={targetId}
        type={followListType}
        onSelectUser={(id) => navigate(`/profile/${id}`)}
      />
    </>
  );
}
