import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { updateMe } from '../api/users.api';
import { fetchProfile } from '../api/social.api';
import { uploadMedia } from '../api/chat.api';
import { fetchBlockedUsers, unblockUser } from '../api/block.api';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import AppNav from '../components/layout/AppNav';

const SECTIONS = [
  { id: 'profile', label: 'Edit profile' },
  { id: 'privacy', label: 'Account privacy' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'blocked', label: 'Blocked accounts' },
];

function linksToText(links) {
  return (links || []).map((l) => l.url).join('\n');
}
function textToLinks(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url) => ({ label: url.replace(/^https?:\/\//, '').split('/')[0], url }));
}

function EditProfileSection({ profile, onSaved }) {
  const [form, setForm] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    work: profile.about?.work || '',
    education: profile.about?.education || '',
    location: profile.about?.location || '',
    links: linksToText(profile.about?.links),
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const uploadAndPatch = async (file, field, setBusy) => {
    setBusy(true);
    try {
      const uploaded = await uploadMedia(file);
      onSaved(await updateMe({ [field]: uploaded.url }));
    } finally {
      setBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      onSaved(
        await updateMe({
          name: form.name,
          bio: form.bio,
          work: form.work,
          education: form.education,
          location: form.location,
          links: textToLinks(form.links),
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <p className="font-display font-semibold text-lg mb-4">Edit profile</p>
        <div className="rounded-xl bg-paper-soft p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar user={profile} size="md" />
            <div>
              <p className="text-sm font-semibold">{profile.username}</p>
              <p className="text-xs text-ink-soft">{profile.name}</p>
            </div>
          </div>
          <input
            type="file"
            ref={avatarInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => e.target.files[0] && uploadAndPatch(e.target.files[0], 'avatarUrl', setUploadingAvatar)}
          />
          <Button variant="outline" className="text-xs" disabled={uploadingAvatar} onClick={() => avatarInputRef.current?.click()}>
            {uploadingAvatar ? 'Uploading...' : 'Change photo'}
          </Button>
        </div>
      </div>

      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="text-sm font-semibold">Name</label>
          <input className="input mt-1.5" value={form.name} onChange={set('name')} placeholder="Name" />
        </div>
        <div>
          <label className="text-sm font-semibold">Bio</label>
          <textarea className="input mt-1.5" rows={3} value={form.bio} onChange={set('bio')} placeholder="Bio" maxLength={150} />
          <p className="text-xs text-ink-soft mt-1 text-right">{form.bio.length} / 150</p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Cover photo</p>
          <input
            type="file"
            ref={coverInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => e.target.files[0] && uploadAndPatch(e.target.files[0], 'coverPhotoUrl', setUploadingCover)}
          />
          <Button type="button" variant="outline" className="text-xs" disabled={uploadingCover} onClick={() => coverInputRef.current?.click()}>
            {uploadingCover ? 'Uploading...' : 'Change cover photo'}
          </Button>
        </div>

        <p className="text-sm font-semibold pt-2 border-t border-line">About</p>
        <input className="input" value={form.work} onChange={set('work')} placeholder="Work" />
        <input className="input" value={form.education} onChange={set('education')} placeholder="Education" />
        <input className="input" value={form.location} onChange={set('location')} placeholder="Location" />
        <textarea className="input" rows={2} value={form.links} onChange={set('links')} placeholder="Links (one per line)" />

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Submit'}
        </Button>
      </form>
    </div>
  );
}

function PrivacySection({ profile, onSaved }) {
  const [value, setValue] = useState(profile.profileVisibility || 'public');
  const [saving, setSaving] = useState(false);

  const options = [
    { id: 'public', label: 'Public', desc: 'Anyone can see your About info.' },
    { id: 'friends', label: 'Friends only', desc: 'Only people you\'re friends with can see it.' },
    { id: 'only_me', label: 'Only me', desc: 'Hidden from everyone else.' },
  ];

  const apply = async (id) => {
    setValue(id);
    setSaving(true);
    try {
      onSaved(await updateMe({ profileVisibility: id }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <p className="font-display font-semibold text-lg">Account privacy</p>
      <p className="text-sm text-ink-soft">Choose who can see your About info (work, education, location, links).</p>
      <div className="space-y-2">
        {options.map((o) => (
          <button
            key={o.id}
            disabled={saving}
            onClick={() => apply(o.id)}
            className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-colors ${
              value === o.id ? 'border-accent bg-accent-soft' : 'border-line hover:bg-paper-soft'
            }`}
          >
            <span
              className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 ${value === o.id ? 'border-accent bg-accent' : 'border-line'}`}
            />
            <span>
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className="block text-xs text-ink-soft">{o.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NotificationsSection() {
  const KEY = 'vartakaro.notificationPrefs';
  const [prefs, setPrefs] = useState(() => {
    try {
      return { messages: true, likesAndComments: true, friendRequests: true, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    } catch {
      return { messages: true, likesAndComments: true, friendRequests: true };
    }
  });

  const toggle = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const rows = [
    { key: 'messages', label: 'Messages', desc: 'New chat messages' },
    { key: 'likesAndComments', label: 'Likes & comments', desc: 'Activity on your posts and stories' },
    { key: 'friendRequests', label: 'Friend requests', desc: 'When someone wants to connect' },
  ];

  return (
    <div className="space-y-4 max-w-xl">
      <p className="font-display font-semibold text-lg">Notifications</p>
      <p className="text-sm text-ink-soft">
        Controls which in-app notifications you get a badge/toast for on this device.
      </p>
      <div className="divide-y divide-line rounded-xl border border-line overflow-hidden">
        {rows.map((r) => (
          <div key={r.key} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium">{r.label}</p>
              <p className="text-xs text-ink-soft">{r.desc}</p>
            </div>
            <button
              onClick={() => toggle(r.key)}
              className={`w-10 h-6 rounded-full relative transition-colors shrink-0 ${prefs[r.key] ? 'bg-accent' : 'bg-line'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  prefs[r.key] ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockedAccountsSection() {
  const [blocked, setBlocked] = useState(null);
  const [unblockingId, setUnblockingId] = useState(null);

  useEffect(() => {
    fetchBlockedUsers().then(setBlocked);
  }, []);

  const unblock = async (userId) => {
    setUnblockingId(userId);
    try {
      await unblockUser(userId);
      setBlocked((prev) => prev.filter((u) => u.id !== userId));
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <p className="font-display font-semibold text-lg">Blocked accounts</p>
      <p className="text-sm text-ink-soft">
        Blocked people can't message you, call you, or start following you again.
      </p>
      {blocked === null ? (
        <p className="text-sm text-ink-soft">Loading...</p>
      ) : blocked.length === 0 ? (
        <p className="text-sm text-ink-soft">You haven't blocked anyone.</p>
      ) : (
        <div className="divide-y divide-line rounded-xl border border-line overflow-hidden">
          {blocked.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar user={user} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-ink-soft truncate">@{user.username}</p>
              </div>
              <Button
                variant="outline"
                className="text-xs px-3 py-1.5"
                disabled={unblockingId === user.id}
                onClick={() => unblock(user.id)}
              >
                {unblockingId === user.id ? 'Unblocking...' : 'Unblock'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const myId = useAuthStore((s) => s.user?.id);
  const updateAuthUser = useAuthStore((s) => s.updateUser);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [section, setSection] = useState('profile');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (myId) fetchProfile(myId).then(setProfile);
  }, [myId]);

  const onSaved = (updated) => {
    setProfile((p) => ({ ...p, ...updated, about: { work: updated.work, education: updated.education, location: updated.location, links: updated.links } }));
    updateAuthUser(updated);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <div className="flex-1 flex min-h-0">
        <aside className="w-64 shrink-0 border-r border-line bg-paper flex flex-col">
          <div className="p-4 border-b border-line flex items-center gap-2">
            <Link to="/profile" className="text-ink-soft hover:text-ink text-lg leading-none">
              &larr;
            </Link>
            <p className="font-display font-bold text-lg">Settings</p>
          </div>
          <nav className="flex-1 p-2 space-y-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium ${
                  section === s.id ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-paper-soft'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <div className="p-2 border-t border-line">
            <button
              onClick={confirmLogout}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8">
          {!profile ? (
            <p className="text-sm text-ink-soft">Loading...</p>
          ) : section === 'profile' ? (
            <EditProfileSection profile={profile} onSaved={onSaved} />
          ) : section === 'privacy' ? (
            <PrivacySection profile={profile} onSaved={onSaved} />
          ) : section === 'notifications' ? (
            <NotificationsSection />
          ) : (
            <BlockedAccountsSection />
          )}
        </main>
      </div>

      <Modal open={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} title="Log out">
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">Are you sure you want to log out?</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
