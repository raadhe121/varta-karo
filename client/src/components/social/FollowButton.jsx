import { useState } from 'react';
import Button from '../common/Button';
import * as socialApi from '../../api/social.api';

function initialStatus(profile) {
  if (profile.isFollowing) return 'following';
  if (profile.hasRequestedFollow) return 'requested';
  return 'none';
}

export default function FollowButton({ profile, onChange }) {
  const [status, setStatus] = useState(() => initialStatus(profile));
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      if (status === 'none') {
        const res = await socialApi.followUser(profile.id);
        setStatus(res.status === 'requested' ? 'requested' : 'following');
      } else {
        // Unfollowing and cancelling a pending request are the same call.
        await socialApi.unfollowUser(profile.id);
        setStatus('none');
      }
      onChange?.();
    } finally {
      setLoading(false);
    }
  };

  const label = status === 'following' ? 'Following' : status === 'requested' ? 'Requested' : 'Follow';

  return (
    <Button variant={status === 'none' ? 'primary' : 'outline'} className="text-sm" disabled={loading} onClick={toggle}>
      {label}
    </Button>
  );
}
