import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppNav from '../components/layout/AppNav';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { fetchCommunities, createCommunity } from '../api/community.api';
import { resolveMediaUrl } from '../utils/media';
import { uploadMedia } from '../api/chat.api';

function CreateCommunityModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const clearCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      // The cover image is only uploaded now, at submit time — not the
      // moment it's picked — so selecting a file never fires a network
      // request on its own.
      let coverImageUrl = null;
      if (coverFile) {
        try {
          coverImageUrl = (await uploadMedia(coverFile)).url;
        } catch (err) {
          throw new Error(err.message || 'Could not upload the cover image');
        }
      }

      const community = await createCommunity({ name: name.trim(), description: description.trim() || undefined, coverImageUrl });
      onCreated(community);
      setName('');
      setDescription('');
      clearCover();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not create community');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Start a community">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold">Name</label>
          <input className="input mt-1.5" placeholder="e.g. Weekend Trekkers" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-sm font-semibold">Description</label>
          <textarea
            className="input mt-1.5"
            rows={3}
            placeholder="What's this community about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Cover image (optional)</label>
          {coverPreview ? (
            <div className="relative mt-1.5">
              <img src={coverPreview} alt="cover" className="h-28 w-full object-cover rounded-xl" />
              <button
                type="button"
                onClick={clearCover}
                className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-paper-dark/70 text-paper text-sm"
              >
                &times;
              </button>
            </div>
          ) : (
            <label className="mt-1.5 flex items-center justify-center h-20 rounded-xl border-2 border-dashed border-line text-sm text-ink-soft cursor-pointer hover:bg-paper-soft">
              Click to upload
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || !name.trim()}>
          {busy ? 'Creating...' : 'Create community'}
        </Button>
      </form>
    </Modal>
  );
}

function CommunityCard({ community }) {
  return (
    <Link
      to={`/communities/${community.id}`}
      className="rounded-2xl bg-paper border border-line overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="h-28 bg-accent-soft">
        {community.coverImageUrl && (
          <img src={resolveMediaUrl(community.coverImageUrl)} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="p-4">
        <p className="font-display font-semibold text-lg truncate">{community.name}</p>
        {community.description && <p className="text-sm text-ink-soft mt-1 line-clamp-2">{community.description}</p>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-ink-soft">
            {community.memberCount} {community.memberCount === 1 ? 'member' : 'members'}
          </span>
          {community.isMember && (
            <span className="text-xs font-semibold text-accent bg-accent-soft rounded-full px-2 py-0.5">
              {community.myRole === 'admin' ? 'Admin' : 'Joined'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = (q) => fetchCommunities(q).then(setCommunities);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search.trim() || undefined), 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <AppNav />
      <div className="w-[90%] max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold">Communities</h1>
            <p className="text-ink-soft text-sm mt-1">Curated circles for shared interests.</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>+ New community</Button>
        </div>

        <input
          className="input mb-6"
          placeholder="Search communities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {communities === null ? (
          <p className="text-sm text-ink-soft text-center py-8">Loading...</p>
        ) : communities.length === 0 ? (
          <p className="text-sm text-ink-soft text-center py-8">No communities yet. Start the first one.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {communities.map((c) => (
              <CommunityCard key={c.id} community={c} />
            ))}
          </div>
        )}
      </div>

      <CreateCommunityModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(c) => setCommunities((prev) => [c, ...(prev || [])])}
      />
    </div>
  );
}
