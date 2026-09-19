import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { fetchCallLog } from '../../api/calls.api';
import { startCall } from '../../call/webrtc';
import { useCallStore } from '../../store/callStore';
import Avatar from '../common/Avatar';
import { colors, radius } from '../../config/theme';

const STATUS_LABEL = {
  answered: 'Answered',
  missed: 'Missed',
  declined: 'Declined',
  no_answer: 'No answer',
};

function timeAgo(dateStr) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function CallHistoryList({ onOpenConversation }) {
  const [calls, setCalls] = useState(null);
  const callPhase = useCallStore((s) => s.phase);

  useEffect(() => {
    fetchCallLog().then(setCalls);
  }, []);

  const callBack = (call, callType) => {
    if (callPhase !== 'idle') return;
    startCall({ toUserId: call.otherUser.id, conversationId: call.conversationId, callType, remoteUser: call.otherUser });
  };

  if (calls === null) {
    return <Text style={styles.empty}>Loading...</Text>;
  }
  if (calls.length === 0) {
    return <Text style={styles.empty}>No call history yet.</Text>;
  }

  return (
    <View>
      {calls.map((call) => {
        const missed = call.direction === 'incoming' && (call.status === 'missed' || call.status === 'no_answer');
        return (
          <Pressable key={call.id} style={styles.row} onPress={() => onOpenConversation(call.conversationId)}>
            <Avatar user={call.otherUser} size="sm" />
            <View style={styles.info}>
              <Text style={[styles.name, missed && styles.missed]}>{call.otherUser?.name}</Text>
              <Text style={styles.meta}>
                {call.direction === 'outgoing' ? '↗' : '↙'} {STATUS_LABEL[call.status]} · {timeAgo(call.createdAt)}
              </Text>
            </View>
            <Pressable style={styles.callBackButton} onPress={() => callBack(call, call.type)}>
              <Text style={{ fontSize: 16 }}>{call.type === 'video' ? '🎥' : '📞'}</Text>
            </Pressable>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 13, color: colors.inkSoft, textAlign: 'center', paddingVertical: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 4 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '700', color: colors.ink },
  missed: { color: '#dc2626' },
  meta: { fontSize: 12, color: colors.inkSoft },
  callBackButton: { height: 32, width: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
