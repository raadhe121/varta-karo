import { useState } from 'react';
import { View } from 'react-native';
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
    return <Button title="Friends ✓" variant="outline" disabled />;
  }

  if (profile.hasPendingFriendRequest?.direction === 'outgoing') {
    return <Button title="Request sent" variant="outline" disabled />;
  }

  if (profile.hasPendingFriendRequest?.direction === 'incoming') {
    const requestId = profile.hasPendingFriendRequest.id;
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Accept" onPress={() => run(() => socialApi.acceptFriendRequest(requestId))} loading={loading} />
        <Button title="Decline" variant="outline" onPress={() => run(() => socialApi.declineFriendRequest(requestId))} loading={loading} />
      </View>
    );
  }

  return <Button title="Add Friend" onPress={() => run(() => socialApi.sendFriendRequest(profile.id))} loading={loading} />;
}
