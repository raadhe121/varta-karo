import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { fetchProfile } from '../api/social.api';
import { fetchUserPosts } from '../api/posts.api';
import { createConversation } from '../api/chat.api';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import AppNav from '../components/layout/AppNav';
import FollowButton from '../components/social/FollowButton';
import FollowListModal from '../components/social/FollowListModal';
import PostCard from '../components/social/PostCard';
import ActivityLog from '../components/social/ActivityLog';
import { resolveMediaUrl } from '../utils/media';

export default function ProfilePage() {
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

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col bg-page">
        <AppNav />
        <div className="h-56 w-full bg-gradient-to-br from-accent-soft to-paper-soft animate-pulse" />
        <div className="max-w-5xl w-full mx-auto px-4">
          <div className="flex items-end justify-between -mt-14">
            <div className="h-20 w-20 rounded-full ring-4 ring-page bg-line animate-pulse" />
            <div className="h-9 w-28 mb-2 rounded-xl bg-paper-soft animate-pulse" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-6 w-48 rounded bg-paper-soft animate-pulse" />
            <div className="h-4 w-32 rounded bg-paper-soft animate-pulse" />
          </div>
          <div className="flex gap-2 mt-4">
            <div className="h-8 w-24 rounded-full bg-paper-soft animate-pulse" />
            <div className="h-8 w-24 rounded-full bg-paper-soft animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 mt-6">
            <div className="h-40 rounded-3xl bg-paper-soft animate-pulse" />
            <div className="space-y-3">
              <div className="h-24 rounded-2xl bg-paper-soft animate-pulse" />
              <div className="h-24 rounded-2xl bg-paper-soft animate-pulse" />
              <div className="h-24 rounded-2xl bg-paper-soft animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <AppNav />

      <div className="relative h-56 w-full bg-gradient-to-br from-accent-soft to-paper-soft overflow-hidden">
        {profile.coverPhotoUrl && (
          <img src={resolveMediaUrl(profile.coverPhotoUrl)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      </div>

      <div className="max-w-5xl w-full mx-auto px-4">
        <div className="flex items-end justify-between -mt-14 relative z-10">
          <div className="rounded-full ring-4 ring-page shadow-lg">
            <Avatar user={profile} size="lg" />
          </div>
          {profile.isSelf ? (
            <div className="flex gap-2 mb-2">
              <Button variant="outline" className="text-sm" onClick={() => navigate('/settings')}>
                ✏️ Edit profile
              </Button>
              <button
                disabled
                title="Coming soon"
                className="text-sm px-4 py-2 rounded-xl border border-line opacity-50 cursor-not-allowed"
              >
                + Add Story
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mb-2">
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
            <h1 className="font-display text-2xl font-bold">{profile.name}</h1>
            {isMutual && (
              <span className="text-[11px] font-semibold text-accent bg-accent-soft rounded-full px-2.5 py-0.5">
                Following each other
              </span>
            )}
          </div>
          <p className="text-sm text-ink-soft">@{profile.username}</p>
          {profile.bio && <p className="text-sm mt-2.5 max-w-md leading-relaxed">{profile.bio}</p>}
        </div>

        <div className="flex gap-2 mt-4">
          {canSeeFollowLists ? (
            <>
              <button
                onClick={() => setFollowListType('followers')}
                className="text-sm rounded-full bg-paper-soft hover:bg-line px-4 py-1.5 transition-colors"
              >
                <strong className="text-ink">{profile.followerCount}</strong>{' '}
                <span className="text-ink-soft">followers</span>
              </button>
              <button
                onClick={() => setFollowListType('following')}
                className="text-sm rounded-full bg-paper-soft hover:bg-line px-4 py-1.5 transition-colors"
              >
                <strong className="text-ink">{profile.followingCount}</strong>{' '}
                <span className="text-ink-soft">following</span>
              </button>
            </>
          ) : (
            <>
              <span className="text-sm rounded-full bg-paper-soft px-4 py-1.5">
                <strong className="text-ink">{profile.followerCount}</strong>{' '}
                <span className="text-ink-soft">followers</span>
              </span>
              <span className="text-sm rounded-full bg-paper-soft px-4 py-1.5">
                <strong className="text-ink">{profile.followingCount}</strong>{' '}
                <span className="text-ink-soft">following</span>
              </span>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 mt-6">
          <div className="space-y-4">
            <div className="rounded-3xl bg-paper p-4 shadow-md shadow-ink/5">
              <p className="text-xs uppercase tracking-wide font-semibold text-ink-soft mb-3">Intro &amp; Archive Details</p>
              {profile.about ? (
                <div className="space-y-2 text-sm">
                  {profile.about.work && <p className="flex items-start gap-2">💼 <span>{profile.about.work}</span></p>}
                  {profile.about.education && <p className="flex items-start gap-2">🎓 <span>{profile.about.education}</span></p>}
                  {profile.about.location && <p className="flex items-start gap-2">📍 <span>{profile.about.location}</span></p>}
                  {(profile.about.links || []).map((l) => (
                    <p key={l.url} className="flex items-start gap-2">
                      🔗{' '}
                      <a href={l.url} target="_blank" rel="noreferrer" className="text-accent underline underline-offset-2">
                        {l.label}
                      </a>
                    </p>
                  ))}
                  {!profile.about.work &&
                    !profile.about.education &&
                    !profile.about.location &&
                    (profile.about.links || []).length === 0 && <p className="text-ink-soft">Nothing added yet.</p>}
                </div>
              ) : (
                <p className="text-sm text-ink-soft">This person's info is private.</p>
              )}
            </div>

            {mediaPosts.length > 0 && (
              <div className="rounded-3xl bg-paper p-4 shadow-md shadow-ink/5">
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
                      src={p.imageUrl}
                      alt=""
                      className="aspect-square rounded-lg object-cover hover:opacity-90 transition-opacity cursor-pointer"
                      onClick={() => setTab('media')}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex gap-1 bg-paper-soft rounded-full p-1 w-fit">
              <button
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  tab === 'posts' ? 'bg-paper text-accent shadow-sm' : 'text-ink-soft hover:text-ink'
                }`}
                onClick={() => setTab('posts')}
              >
                Timeline
              </button>
              <button
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  tab === 'media' ? 'bg-paper text-accent shadow-sm' : 'text-ink-soft hover:text-ink'
                }`}
                onClick={() => setTab('media')}
              >
                Media
              </button>
              {profile.isSelf && (
                <button
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    tab === 'activity' ? 'bg-paper text-accent shadow-sm' : 'text-ink-soft hover:text-ink'
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
                  <div className="rounded-3xl bg-paper p-10 text-center shadow-sm shadow-ink/5">
                    <p className="text-3xl mb-2">📝</p>
                    <p className="text-sm text-ink-soft">
                      {profile.isSelf ? "You haven't posted anything yet." : `${profile.name} hasn't posted anything yet.`}
                    </p>
                  </div>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))} />
                  ))
                ))}
              {tab === 'media' &&
                (mediaPosts.length === 0 ? (
                  <div className="rounded-3xl bg-paper p-10 text-center shadow-sm shadow-ink/5">
                    <p className="text-3xl mb-2">🖼️</p>
                    <p className="text-sm text-ink-soft">No photos yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {mediaPosts.map((p) => (
                      <img key={p.id} src={p.imageUrl} alt="" className="aspect-square rounded-xl object-cover hover:opacity-90 transition-opacity" />
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
    </div>
  );
}
