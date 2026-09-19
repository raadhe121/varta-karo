import { useState } from 'react';
import Button from '../common/Button';
import * as socialApi from '../../api/social.api';

export default function FriendButton({ profile, onChange }) {
  const [loading, setLoading] = useState(false);

  const run = async (fn) => {
    setLoading(true);
    try {
      await fn();
      onChange?.();
    } finally {
      setLoading(false);
    }
  };

  if (profile.isFriend) {
    return (
      <Button variant="outline" disabled className="text-sm">
        Friends ✓
      </Button>
    );
  }

  if (profile.hasPendingFriendRequest?.direction === 'outgoing') {
    return (
      <Button variant="outline" disabled className="text-sm">
        Request sent
      </Button>
    );
  }

  if (profile.hasPendingFriendRequest?.direction === 'incoming') {
    const requestId = profile.hasPendingFriendRequest.id;
    return (
      <div className="flex gap-2">
        <Button
          className="text-sm"
          disabled={loading}
          onClick={() => run(() => socialApi.acceptFriendRequest(requestId))}
        >
          Accept
        </Button>
        <Button
          variant="outline"
          className="text-sm"
          disabled={loading}
          onClick={() => run(() => socialApi.declineFriendRequest(requestId))}
        >
          Decline
        </Button>
      </div>
    );
  }

  return (
    <Button className="text-sm" disabled={loading} onClick={() => run(() => socialApi.sendFriendRequest(profile.id))}>
      Add Friend
    </Button>
  );
}
