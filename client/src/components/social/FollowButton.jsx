import { useState } from 'react';
import Button from '../common/Button';
import * as socialApi from '../../api/social.api';

export default function FollowButton({ profile, onChange }) {
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      if (profile.isFollowing) {
        await socialApi.unfollowUser(profile.id);
      } else {
        await socialApi.followUser(profile.id);
      }
      onChange?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant={profile.isFollowing ? 'outline' : 'primary'} className="text-sm" disabled={loading} onClick={toggle}>
      {profile.isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
