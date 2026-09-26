import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../hooks/useSocket';
import { updateMe, updateUsername, updateEmail, updatePassword } from '../api/users.api';
import { fetchProfile } from '../api/social.api';
import { uploadMedia } from '../api/chat.api';
import { fetchBlockedUsers, unblockUser } from '../api/block.api';
import { getNotificationPrefs, setNotificationPrefs } from '../utils/notificationPrefs';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import IncomingCallModal from '../components/call/IncomingCallModal';
import ActiveCallOverlay from '../components/call/ActiveCallOverlay';
import HomeTopBar from '../components/layout/HomeTopBar';

const SECTIONS = [
  {
    id: 'profile',
    label: 'Edit profile',
    sub: 'Name, photo, bio, details',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      </svg>
    ),
  },
  {
    id: 'security',
    label: 'Account & security',
    sub: 'Password, email, sign-in',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      </svg>
    ),
  },
  {
    id: 'privacy',
    label: 'Privacy',
    sub: 'Who can see and message you',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 0 1 8 0v3" />
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    sub: 'Choose what alerts you get',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 9a6 6 0 1 1 12 0c0 3.5 1 5 1.5 6H4.5C5 14 6 12.5 6 9Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 17.5a2.5 2.5 0 0 0 5 0" />
      </svg>
    ),
  },
  {
    id: 'appearance',
    label: 'Appearance',
    sub: 'Dark or light theme',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="4.5" />
        <path
          strokeLinecap="round"
          d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
        />
      </svg>
    ),
  },
  {
    id: 'blocked',
    label: 'Blocked accounts',
    sub: "People you've blocked",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="m5.5 5.5 13 13" />
      </svg>
    ),
  },
];

function linksToUrl(links) {
  return links?.[0]?.url || '';
}
function urlToLinks(url) {
  const trimmed = url.trim();
  if (!trimmed) return [];
  return [{ label: trimmed.replace(/^https?:\/\//, '').split('/')[0], url: trimmed }];
}

function FieldInput({ icon, className = '', ...props }) {
  return (
    <div className={`relative ${className}`}>
      {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft pointer-events-none">{icon}</span>}
      <input className={`input ${icon ? 'pl-10' : ''}`} {...props} />
    </div>
  );
}

function EditProfileSection({ profile, onSaved }) {
  const [form, setForm] = useState({
    name: profile.name || '',
    username: profile.username || '',
    bio: profile.bio || '',
    work: profile.about?.work || '',
    education: profile.about?.education || '',
    location: profile.about?.location || '',
    website: linksToUrl(profile.about?.links),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
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

  const removePhoto = async (field) => {
    onSaved(await updateMe({ [field]: null }));
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let updated = await updateMe({
        name: form.name,
        bio: form.bio,
        work: form.work,
        education: form.education,
        location: form.location,
        links: urlToLinks(form.website),
      });
      if (form.username.trim() !== profile.username) {
        updated = await updateUsername(form.username.trim());
      }
      onSaved(updated);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-3xl">
      <p className="font-display text-3xl font-bold">Edit profile</p>
      <p className="text-sm text-ink-soft mt-1 mb-5">This is how people see you on VartaKaro.</p>

      <div className="rounded-2xl bg-gradient-to-br from-[#4c3a8f] to-[#241a4d] overflow-hidden">
        <div className="relative h-32">
          <div className="absolute -top-10 -right-6 h-44 w-44 rounded-full border border-white/10" />
          <div className="absolute top-4 right-16 h-20 w-20 rounded-full border border-white/10" />
          <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files[0] && uploadAndPatch(e.target.files[0], 'coverPhotoUrl', setUploadingCover)} />
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute top-3 right-3 flex items-center gap-1.5 rounded-xl bg-black/40 hover:bg-black/55 text-white text-xs font-semibold px-3 py-1.5"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8a2 2 0 0 1 2-2h1.5l1-1.5h7l1 1.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
              <circle cx="12" cy="13" r="3.2" />
            </svg>
            {uploadingCover ? 'Uploading...' : 'Change cover'}
          </button>
        </div>
        <div className="bg-paper flex items-center gap-3 px-4 py-3">
          <div className="-mt-8 rounded-full ring-4 ring-paper shrink-0">
            <Avatar user={profile} size="lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{profile.name}</p>
            <p className="text-sm text-ink-soft truncate">@{profile.username}</p>
          </div>
          <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => e.target.files[0] && uploadAndPatch(e.target.files[0], 'avatarUrl', setUploadingAvatar)} />
          <Button type="button" disabled={uploadingAvatar} onClick={() => avatarInputRef.current?.click()}>
            {uploadingAvatar ? 'Uploading...' : 'Change photo'}
          </Button>
          {profile.avatarUrl && (
            <Button type="button" variant="outline" onClick={() => removePhoto('avatarUrl')}>
              Remove
            </Button>
          )}
        </div>
      </div>

      <p className="text-xs uppercase tracking-wide font-semibold text-ink-soft mt-6 mb-3">Basic info</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold">Name</label>
          <input className="input mt-1.5" value={form.name} onChange={set('name')} placeholder="Name" />
        </div>
        <div>
          <label className="text-sm font-semibold">Username</label>
          <FieldInput className="mt-1.5" icon="@" value={form.username} onChange={set('username')} placeholder="username" />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">Bio</label>
          <span className="text-xs text-ink-soft">{form.bio.length} / 150</span>
        </div>
        <textarea
          className="input mt-1.5"
          rows={3}
          value={form.bio}
          onChange={set('bio')}
          placeholder="Tell people a little about yourself"
          maxLength={150}
        />
      </div>

      <div className="mt-6 pt-5 border-t border-line">
        <p className="text-xs uppercase tracking-wide font-semibold text-ink-soft">About</p>
        <p className="text-sm text-ink-soft mt-1 mb-3">Optional. Shown on your profile.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold">Work</label>
            <FieldInput
              className="mt-1.5"
              value={form.work}
              onChange={set('work')}
              placeholder="Where do you work?"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              }
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Education</label>
            <FieldInput
              className="mt-1.5"
              value={form.education}
              onChange={set('education')}
              placeholder="School or college"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 9.5 12 5l10 4.5-10 4.5-10-4.5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5" />
                </svg>
              }
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Lives in</label>
            <FieldInput
              className="mt-1.5"
              value={form.location}
              onChange={set('location')}
              placeholder="City"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
                  <circle cx="12" cy="9.5" r="2.3" />
                </svg>
              }
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Website</label>
            <FieldInput
              className="mt-1.5"
              value={form.website}
              onChange={set('website')}
              placeholder="https://"
              icon={
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m10 14 4-4M8 12l-2.5 2.5a3 3 0 0 0 4.2 4.2L12 16M16 12l2.5-2.5a3 3 0 0 0-4.2-4.2L12 8" />
                </svg>
              }
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      <div className="flex justify-end gap-3 mt-6">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

function EmailForm({ profile, onSaved }) {
  const [email, setEmail] = useState(profile.email || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSaving(true);
    try {
      onSaved(await updateEmail(email.trim()));
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update email');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm font-semibold">Email address</p>
      <input
        type="email"
        className="input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">Email updated.</p>}
      <Button type="submit" disabled={saving || email.trim() === (profile.email || '')}>
        {saving ? 'Saving...' : 'Save email'}
      </Button>
    </form>
  );
}

function PasswordForm({ hasPassword: initialHasPassword }) {
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await updatePassword({ currentPassword: hasPassword ? currentPassword : undefined, newPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setHasPassword(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm font-semibold">{hasPassword ? 'Change password' : 'Set a password'}</p>
      {!hasPassword && (
        <p className="text-xs text-ink-soft">
          Your account doesn't have a password yet (you signed up with just a username). Set one to be able to log in
          with a password later.
        </p>
      )}
      {hasPassword && (
        <input
          type="password"
          className="input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Current password"
          required
        />
      )}
      <input
        type="password"
        className="input"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New password (min. 8 characters)"
        minLength={8}
        required
      />
      <input
        type="password"
        className="input"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        minLength={8}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">Password updated.</p>}
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : hasPassword ? 'Update password' : 'Set password'}
      </Button>
    </form>
  );
}

function SecuritySection({ profile, onSaved }) {
  return (
    <div className="max-w-xl">
      <p className="font-display text-3xl font-bold mb-5">Account &amp; security</p>
      <div className="space-y-8">
        <div className="pb-6 border-b border-line">
          <EmailForm profile={profile} onSaved={onSaved} />
        </div>
        <PasswordForm hasPassword={Boolean(profile.hasPassword)} />
      </div>
    </div>
  );
}

function PrivateAccountToggle({ profile, onSaved }) {
  const [saving, setSaving] = useState(false);
  const isPrivate = Boolean(profile.isPrivate);

  const toggle = async () => {
    setSaving(true);
    try {
      onSaved(await updateMe({ isPrivate: !isPrivate }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-line">
      <div>
        <p className="text-sm font-semibold">Private account</p>
        <p className="text-xs text-ink-soft mt-0.5">
          {isPrivate
            ? 'Only people you approve can follow you and see your posts.'
            : 'Anyone can follow you and see your public posts.'}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`w-10 h-6 rounded-full relative transition-colors shrink-0 ${isPrivate ? 'bg-accent' : 'bg-line'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            isPrivate ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>
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
    <div className="max-w-xl">
      <p className="font-display text-3xl font-bold mb-5">Privacy</p>
      <div className="space-y-4">
        <PrivateAccountToggle profile={profile} onSaved={onSaved} />

        <p className="text-sm font-semibold pt-2">About info visibility</p>
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
    </div>
  );
}

function NotificationsSection() {
  const [prefs, setPrefs] = useState(getNotificationPrefs());

  const toggle = (key) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setNotificationPrefs(next);
  };

  const rows = [
    { key: 'newFollowers', label: 'New followers', desc: 'When someone follows you' },
    { key: 'likes', label: 'Likes', desc: 'Activity on your posts and stories' },
    { key: 'commentsAndMentions', label: 'Comments & mentions', desc: 'When someone comments or mentions you' },
    { key: 'messages', label: 'Messages', desc: 'New chat messages' },
  ];

  return (
    <div className="max-w-xl">
      <p className="font-display text-3xl font-bold mb-5">Notifications</p>
      <p className="text-sm text-ink-soft mb-4">
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

function AppearanceSection() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <div className="max-w-xl">
      <p className="font-display text-3xl font-bold mb-5">Appearance</p>
      <div className="flex items-center justify-between p-4 rounded-xl border border-line">
        <div>
          <p className="text-sm font-semibold">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
          <p className="text-xs text-ink-soft mt-0.5">Switch between light and dark theme.</p>
        </div>
        <Button variant="outline" onClick={toggleTheme}>
          Switch to {theme === 'dark' ? 'light' : 'dark'}
        </Button>
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
    <div className="max-w-xl">
      <p className="font-display text-3xl font-bold mb-5">Blocked accounts</p>
      <p className="text-sm text-ink-soft mb-4">Blocked people can't message you, call you, or start following you again.</p>
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
  useSocket();
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

  return (
    <div className="min-h-screen flex flex-col bg-page">
      <IncomingCallModal />
      <ActiveCallOverlay />
      <HomeTopBar showCreate={false} searchPlaceholder="Search settings" />

      <aside className="w-72 shrink-0 lg:fixed lg:left-0 lg:top-16 lg:bottom-0 lg:overflow-y-auto px-6 py-6">
          <Link to="/profile" className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            Back to profile
          </Link>
          <p className="font-display text-3xl font-bold mb-4">Settings</p>
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full flex items-start gap-3 text-left px-3.5 py-2.5 rounded-xl transition-colors ${
                  section === s.id ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-paper-soft'
                }`}
              >
                <span className="mt-0.5">{s.icon}</span>
                <span>
                  <span className="block text-sm font-semibold">{s.label}</span>
                  <span className={`block text-xs ${section === s.id ? 'text-accent/80' : 'text-ink-soft'}`}>{s.sub}</span>
                </span>
              </button>
            ))}
          </nav>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-2 mt-8 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-500/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5M21 12H9" />
            </svg>
            Log out
          </button>
        </aside>

      <div className="flex-1 flex justify-center gap-8 px-6 py-6 lg:pl-72">
        <main className="flex-1 max-w-3xl">
          {!profile ? (
            <p className="text-sm text-ink-soft">Loading...</p>
          ) : section === 'profile' ? (
            <EditProfileSection profile={profile} onSaved={onSaved} />
          ) : section === 'security' ? (
            <SecuritySection profile={profile} onSaved={onSaved} />
          ) : section === 'privacy' ? (
            <PrivacySection profile={profile} onSaved={onSaved} />
          ) : section === 'notifications' ? (
            <NotificationsSection />
          ) : section === 'appearance' ? (
            <AppearanceSection />
          ) : (
            <BlockedAccountsSection />
          )}
        </main>

        {section === 'profile' && (
          <div className="hidden xl:block w-[280px] shrink-0">
            <div className="rounded-2xl bg-paper border border-line p-5">
              <div className="h-9 w-9 rounded-full bg-accent-soft text-accent flex items-center justify-center mb-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9v.2h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3Z" />
                </svg>
              </div>
              <p className="font-semibold text-sm mb-1.5">Tip</p>
              <p className="text-sm text-ink-soft">
                A clear photo of your face and a short bio make it easier for friends to recognise and follow you.
              </p>
            </div>
          </div>
        )}
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
