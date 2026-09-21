import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { fetchProfile } from '../api/social.api';
import { fetchUserPosts } from '../api/posts.api';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import AppNav from '../components/layout/AppNav';
import FriendButton from '../components/social/FriendButton';
import FollowButton from '../components/social/FollowButton';
import PostCard from '../components/social/PostCard';
import ActivityLog from '../components/social/ActivityLog';
import { resolveMediaUrl } from '../utils/media';

export default function ProfilePage() {
  const { userId } = useParams();
  const myId = useAuthStore((s) => s.user?.id);
  const navigate = useNavigate();

  const targetId = userId || myId;
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('posts');
  const [posts, setPosts] = useState(null);

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
  const totalCircle = profile ? profile.friendCount + profile.followerCount : 0;
  const closeCirclePct = totalCircle > 0 ? Math.round((profile.friendCount / totalCircle) * 100) : 0;

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppNav />
        <p className="p-8 text-ink-soft">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />

      <div
        className="h-48 w-full bg-paper-soft"
        style={profile.coverPhotoUrl ? { backgroundImage: `url(${resolveMediaUrl(profile.coverPhotoUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      />

      <div className="max-w-5xl w-full mx-auto px-4 -mt-12">
        <div className="flex items-end justify-between">
          <div className="border-4 border-paper rounded-2xl">
            <Avatar user={profile} size="lg" />
          </div>
          {profile.isSelf ? (
            <div className="flex gap-2 mb-2">
              <Button variant="outline" className="text-sm" onClick={() => navigate('/settings')}>
                Edit profile
              </Button>
              <button disabled title="Coming soon" className="text-sm px-4 py-2 rounded-xl border border-line opacity-50 cursor-not-allowed">
                + Add Story
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mb-2">
              <FriendButton profile={profile} onChange={load} />
              <FollowButton profile={profile} onChange={load} />
            </div>
          )}
        </div>

        <div className="mt-3">
          <h1 className="font-display text-2xl font-semibold">{profile.name}</h1>
          <p className="text-sm text-ink-soft">@{profile.username}</p>
          {profile.bio && <p className="text-sm mt-2">{profile.bio}</p>}
        </div>

        <div className="flex gap-4 text-sm text-ink-soft mt-3">
          <span>
            <strong className="text-ink">{profile.friendCount}</strong> friends
          </span>
          <span>
            <strong className="text-ink">{profile.followerCount}</strong> followers
          </span>
          <span>
            <strong className="text-ink">{profile.followingCount}</strong> following
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 mt-6">
          <div className="space-y-4">
            <div className="rounded-3xl bg-paper p-4 shadow-md shadow-ink/5">
              <p className="text-xs uppercase tracking-wide text-ink-soft mb-2">Intro &amp; Archive Details</p>
              {profile.about ? (
                  <div className="space-y-1 text-sm">
                    {profile.about.work && <p>💼 {profile.about.work}</p>}
                    {profile.about.education && <p>🎓 {profile.about.education}</p>}
                    {profile.about.location && <p>📍 {profile.about.location}</p>}
                    {(profile.about.links || []).map((l) => (
                      <p key={l.url}>
                        🔗{' '}
                        <a href={l.url} target="_blank" rel="noreferrer" className="underline">
                          {l.label}
                        </a>
                      </p>
                    ))}
                    {!profile.about.work && !profile.about.education && !profile.about.location && (profile.about.links || []).length === 0 && (
                      <p className="text-ink-soft">Nothing added yet.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-ink-soft">This person's info is private.</p>
                )}
              </div>

            {totalCircle > 0 && (
              <div className="rounded-3xl bg-paper p-4 shadow-md shadow-ink/5">
                <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Social Graph</p>
                <div className="h-2 rounded-full bg-accent-soft overflow-hidden mb-2">
                  <div className="h-full bg-accent" style={{ width: `${closeCirclePct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-ink-soft">
                  <span>Friends ({closeCirclePct}%)</span>
                  <span>Followers ({100 - closeCirclePct}%)</span>
                </div>
              </div>
            )}

            {mediaPosts.length > 0 && (
              <div className="rounded-3xl bg-paper p-4 shadow-md shadow-ink/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-wide text-ink-soft">Visual Journal</p>
                  <button onClick={() => setTab('media')} className="text-xs text-accent hover:underline">
                    View all
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {mediaPosts.slice(0, 6).map((p) => (
                    <img key={p.id} src={p.imageUrl} alt="" className="aspect-square rounded-lg object-cover" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex gap-1 border-b border-line">
              <button
                className={`px-4 py-2 text-sm font-medium ${tab === 'posts' ? 'border-b-2 border-accent text-ink' : 'text-ink-soft'}`}
                onClick={() => setTab('posts')}
              >
                Timeline &amp; Letters
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${tab === 'media' ? 'border-b-2 border-accent text-ink' : 'text-ink-soft'}`}
                onClick={() => setTab('media')}
              >
                Media &amp; Folio
              </button>
              {profile.isSelf && (
                <button
                  className={`px-4 py-2 text-sm font-medium ${tab === 'activity' ? 'border-b-2 border-accent text-ink' : 'text-ink-soft'}`}
                  onClick={() => setTab('activity')}
                >
                  Activity Log
                </button>
              )}
            </div>

            <div className="py-4 pb-12 space-y-3">
              {tab === 'posts' &&
                (posts === null ? (
                  <p className="text-sm text-ink-soft">Loading...</p>
                ) : posts.length === 0 ? (
                  <p className="text-sm text-ink-soft">No posts yet.</p>
                ) : (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))} />
                  ))
                ))}
              {tab === 'media' &&
                (mediaPosts.length === 0 ? (
                  <p className="text-sm text-ink-soft">No photos yet.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {mediaPosts.map((p) => (
                      <img key={p.id} src={p.imageUrl} alt="" className="aspect-square rounded-xl object-cover" />
                    ))}
                  </div>
                ))}
              {tab === 'activity' && <ActivityLog />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
