import { View, Text, Image, StyleSheet, Linking, Pressable } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, radius } from '../../config/theme';
import { API_ORIGIN } from '../../config/env';

function statusSummary(statuses = []) {
  if (statuses.length === 0) return 'sent';
  if (statuses.every((s) => s.status === 'read')) return 'read';
  return 'delivered';
}

function ticks(status) {
  if (status === 'sent') return '✓';
  return '✓✓';
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function mediaUri(path) {
  return path?.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

export default function MessageBubble({ message, showSender }) {
  const myId = useAuthStore((s) => s.user?.id);
  const isMine = message.senderId === myId;
  const status = statusSummary(message.statuses);

  return (
    <View style={[styles.row, { justifyContent: isMine ? 'flex-end' : 'flex-start' }]}>
      <View style={[styles.bubble, isMine ? styles.mine : styles.theirs]}>
        {showSender && !isMine && <Text style={styles.sender}>{message.senderName}</Text>}

        {message.type === 'image' && message.mediaUrl && (
          <Image source={{ uri: mediaUri(message.mediaUrl) }} style={styles.image} />
        )}
        {message.type === 'file' && message.mediaUrl && (
          <Pressable onPress={() => Linking.openURL(mediaUri(message.mediaUrl))}>
            <Text style={[styles.fileLink, { color: isMine ? colors.white : colors.accent }]}>
              📎 {message.mediaMeta?.originalName || 'Attachment'}
            </Text>
          </Pressable>
        )}
        {message.content ? <Text style={[styles.content, { color: isMine ? colors.white : colors.ink }]}>{message.content}</Text> : null}

        <View style={styles.metaRow}>
          <Text style={[styles.time, { color: isMine ? 'rgba(255,255,255,0.8)' : colors.inkSoft }]}>{formatTime(message.createdAt)}</Text>
          {isMine && <Text style={[styles.time, { color: status === 'read' ? colors.white : 'rgba(255,255,255,0.7)' }]}> {ticks(status)}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 8 },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.lg },
  mine: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.paperSoft, borderBottomLeftRadius: 4 },
  sender: { fontSize: 12, fontWeight: '700', color: colors.accent, marginBottom: 2 },
  content: { fontSize: 15 },
  image: { width: 200, height: 200, borderRadius: radius.sm, marginBottom: 4 },
  fileLink: { textDecorationLine: 'underline', fontSize: 14, marginBottom: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, gap: 2 },
  time: { fontSize: 10 },
});
