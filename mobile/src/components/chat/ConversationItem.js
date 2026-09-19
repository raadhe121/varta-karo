import { Pressable, View, Text, StyleSheet } from 'react-native';
import Avatar from '../common/Avatar';
import { usePresenceStore } from '../../store/presenceStore';
import { useAuthStore } from '../../store/authStore';
import { colors, radius } from '../../config/theme';

function otherParticipant(conversation, myId) {
  return conversation.participants.find((p) => p.id !== myId);
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ConversationItem({ conversation, onPress }) {
  const myId = useAuthStore((s) => s.user?.id);
  const isOnline = usePresenceStore((s) => s.isOnline);

  const displayUser = conversation.type === 'direct' ? otherParticipant(conversation, myId) : null;
  const title = conversation.type === 'group' ? conversation.name : displayUser?.name || 'Unknown';
  const avatarUser = conversation.type === 'group' ? { name: conversation.name, avatarUrl: conversation.avatarUrl } : displayUser;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Avatar user={avatarUser} showStatus={conversation.type === 'direct'} isOnline={isOnline(displayUser?.id)} />
      <View style={styles.textCol}>
        <View style={styles.topLine}>
          <Text style={styles.name} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.time}>{timeAgo(conversation.lastMessage?.createdAt)}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {conversation.lastMessage
            ? conversation.lastMessage.type === 'text'
              ? conversation.lastMessage.content
              : '📎 Attachment'
            : 'Say hello 👋'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 4, borderRadius: radius.md },
  pressed: { backgroundColor: colors.paperSoft },
  textCol: { flex: 1, minWidth: 0 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { fontSize: 15, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  time: { fontSize: 11, color: colors.inkSoft },
  preview: { fontSize: 13, color: colors.inkSoft, marginTop: 2 },
});
