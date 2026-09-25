import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppNav from '../components/layout/AppNav';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import { useAuthStore } from '../store/authStore';
import { resolveMediaUrl } from '../utils/media';
import { uploadMedia } from '../api/chat.api';
import {
  fetchCommunity,
  fetchCommunityMembers,
  fetchCommunityPosts,
  createCommunityPost,
  deleteCommunityPost,
  joinCommunity,
  leaveCommunity,
  deleteCommunity,
} from '../api/community.api';

function timeAgo(dateStr) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function PostComposer({ communityId, onCreated }) {
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadMedia(file);
      setImageUrl(uploaded.url);
      setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !imageUrl) return;
    setPosting(true);
    try {
      const post = await createCommunityPost(communityId, { content: content.trim() || undefined, imageUrl, mediaType });
      onCreated(post);
      setContent('');
      setImageUrl(null);
      setMediaType(null);
    } finally {
      setPosting(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-paper border border-line p-4 space-y-3">
      <textarea
        className="input"
        rows={3}
        placeholder="Share something with this community..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {imageUrl && (
        <div className="relative inline-block">
          {mediaType === 'video' ? (
            <video src={resolveMediaUrl(imageUrl)} controls className="max-h-48 rounded-xl" />
          ) : (
            <img src={resolveMediaUrl(imageUrl)} alt="attachment" className="max-h-48 rounded-xl" />
          )}
          <button
            type="button"
            onClick={() => {
              setImageUrl(null);
              setMediaType(null);
            }}
            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-paper-dark/70 text-paper text-sm"
          >
            &times;
          </button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <label className="text-sm text-ink-soft cursor-pointer hover:text-ink">
          {uploading ? 'Uploading...' : '📎 Attach'}
          <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFile} disabled={uploading} />
        </label>
        <Button type="submit" disabled={posting || uploading || (!content.trim() && !imageUrl)}>
          {posting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </form>
  );
}

function CommunityPostCard({ post, canDelete, onDeleted }) {
  return (
    <div className="rounded-2xl bg-paper border border-line p-4">
      <div className="flex items-center gap-2.5">
        <Avatar user={post.author} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{post.author.name}</p>
          <p className="text-xs text-ink-soft">{timeAgo(post.createdAt)}</p>
        </div>
        {canDelete && (
          <button onClick={() => onDeleted(post.id)} className="ml-auto text-xs text-ink-soft hover:text-red-600">
            Delete
          </button>
        )}
      </div>
      {post.content && <p className="text-sm mt-3 whitespace-pre-wrap">{post.content}</p>}
      {post.imageUrl &&
        (post.mediaType === 'video' ? (
          <video src={resolveMediaUrl(post.imageUrl)} controls className="mt-3 rounded-xl max-h-96 w-full object-cover" />
        ) : (
          <img src={resolveMediaUrl(post.imageUrl)} alt="" className="mt-3 rounded-xl max-h-96 w-full object-cover" />
        ))}
    </div>
  );
}

export default function CommunityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const myId = useAuthStore((s) => s.user?.id);

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState(null);
  const [members, setMembers] = useState(null);
  const [tab, setTab] = useState('posts');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCommunity(null);
    setPosts(null);
    setMembers(null);
    setTab('posts');
    fetchCommunity(id).then(setCommunity).catch(() => setError('Community not found'));
  }, [id]);

  useEffect(() => {
    if (!community?.isMember) return;
    fetchCommunityPosts(id).then(setPosts);
    fetchCommunityMembers(id).then(setMembers);
  }, [id, community?.isMember]);

  const handleJoin = async () => {
    setBusy(true);
    try {
      setCommunity(await joinCommunity(id));
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    try {
      await leaveCommunity(id);
      setCommunity((c) => ({ ...c, isMember: false, myRole: null, memberCount: c.memberCount - 1 }));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!confirm(`Delete "${community.name}"? This removes all its posts and members.`)) return;
    await deleteCommunity(id);
    navigate('/communities');
  };

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-page">
        <AppNav />
        <p className="text-center text-ink-soft py-16">{error}</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex flex-col bg-page">
        <AppNav />
        <p className="text-center text-ink-soft py-16">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <AppNav />
      <div className="w-[90%] max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-2xl bg-paper border border-line overflow-hidden mb-6">
          <div className="h-36 bg-accent-soft">
            {community.coverImageUrl && (
              <img src={resolveMediaUrl(community.coverImageUrl)} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold">{community.name}</h1>
                <p className="text-sm text-ink-soft mt-1">
                  {community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {community.isMember ? (
                  community.myRole === 'admin' ? (
                    <Button variant="danger" onClick={handleDeleteCommunity}>
                      Delete
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleLeave} disabled={busy}>
                      {busy ? 'Leaving...' : 'Leave'}
                    </Button>
                  )
                ) : (
                  <Button onClick={handleJoin} disabled={busy}>
                    {busy ? 'Joining...' : 'Join community'}
                  </Button>
                )}
              </div>
            </div>
            {community.description && <p className="text-sm mt-3 text-ink">{community.description}</p>}
          </div>
        </div>

        {!community.isMember ? (
          <p className="text-sm text-ink-soft text-center py-12">Join this community to see and share posts.</p>
        ) : (
          <>
            <div className="flex gap-1 mb-5 bg-paper-soft rounded-full p-1 w-fit">
              <button
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  tab === 'posts' ? 'bg-paper shadow-sm text-accent' : 'text-ink-soft'
                }`}
                onClick={() => setTab('posts')}
              >
                Posts
              </button>
              <button
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  tab === 'members' ? 'bg-paper shadow-sm text-accent' : 'text-ink-soft'
                }`}
                onClick={() => setTab('members')}
              >
                Members ({community.memberCount})
              </button>
            </div>

            {tab === 'posts' ? (
              <div className="space-y-4">
                <PostComposer communityId={id} onCreated={(p) => setPosts((prev) => [p, ...(prev || [])])} />
                {posts === null ? (
                  <p className="text-sm text-ink-soft text-center py-8">Loading...</p>
                ) : posts.length === 0 ? (
                  <p className="text-sm text-ink-soft text-center py-8">No posts yet. Be the first to share something.</p>
                ) : (
                  posts.map((post) => (
                    <CommunityPostCard
                      key={post.id}
                      post={post}
                      canDelete={post.author.id === myId || community.myRole === 'admin'}
                      onDeleted={async (postId) => {
                        await deleteCommunityPost(id, postId);
                        setPosts((prev) => prev.filter((p) => p.id !== postId));
                      }}
                    />
                  ))
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-paper border border-line divide-y divide-line">
                {members === null ? (
                  <p className="text-sm text-ink-soft text-center py-8">Loading...</p>
                ) : (
                  members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-4">
                      <Avatar user={m} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{m.name}</p>
                        <p className="text-xs text-ink-soft truncate">@{m.username}</p>
                      </div>
                      {m.role === 'admin' && (
                        <span className="ml-auto text-xs font-semibold text-accent bg-accent-soft rounded-full px-2 py-0.5">
                          Admin
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
