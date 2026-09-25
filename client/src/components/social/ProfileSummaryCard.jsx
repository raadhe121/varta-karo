import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { fetchProfile } from '../../api/social.api';
import Avatar from '../common/Avatar';

export default function ProfileSummaryCard() {
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user?.id) fetchProfile(user.id).then(setProfile);
  }, [user?.id]);

  if (!user) return null;

  return (
    <Link to="/profile" className="block rounded-xl bg-paper border border-line p-4 hover:border-accent/40 transition-colors">
      <div className="flex items-center gap-3">
        <Avatar user={user} size="md" />
        <div className="min-w-0">
          <p className="font-display font-semibold truncate">{user.name}</p>
          {user.bio && <p className="text-xs text-ink-soft truncate">{user.bio}</p>}
        </div>
      </div>
      {profile && (
        <div className="flex gap-4 text-sm text-ink-soft mt-3 pt-3 border-t border-line">
          <span>
            <strong className="text-ink">{profile.followerCount}</strong> followers
          </span>
          <span>
            <strong className="text-ink">{profile.followingCount}</strong> following
          </span>
        </div>
      )}
    </Link>
  );
}
