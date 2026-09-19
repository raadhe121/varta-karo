import { useEffect } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Screen from '../../components/common/Screen';
import Avatar from '../../components/common/Avatar';
import { fetchNotifications, markAllNotificationsRead } from '../../api/notifications.api';
import { useNotificationStore } from '../../store/notificationStore';
import { colors, radius } from '../../config/theme';

const TYPE_TEXT = {
  friend_request: 'sent you a friend request',
  friend_accepted: 'accepted your friend request',
  follow: 'started following you',
  contact_request: 'wants to add you as a contact',
  contact_accepted: 'accepted your contact request',
  like: 'liked your post',
  comment: 'commented on your post',
};

function timeAgo(dateStr) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const items = useNotificationStore((s) => s.items);
  const setItems = useNotificationStore((s) => s.setItems);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  useEffect(() => {
    fetchNotifications().then(setItems);
    markAllNotificationsRead().then(markAllRead);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (n) => {
    if (['friend_request', 'friend_accepted', 'follow'].includes(n.type)) {
      navigation.navigate('Profile', { userId: n.actor.id });
    } else if (n.type === 'like' || n.type === 'comment') {
      navigation.navigate('Profile', {});
    } else {
      navigation.navigate('Chat', {});
    }
  };

  return (
    <Screen>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={items || []}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          items === null ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
          ) : (
            <Text style={styles.empty}>Nothing here yet. Likes, comments, and friend requests will show up here.</Text>
          )
        }
        renderItem={({ item: n }) => (
          <Pressable style={[styles.row, !n.read && styles.rowUnread]} onPress={() => goTo(n)}>
            <Avatar user={n.actor} size="sm" />
            <View style={{ flex: 1 }}>
              <Text style={styles.text}>
                <Text style={styles.actor}>{n.actor.name}</Text> {TYPE_TEXT[n.type]}
                {n.postSummary ? <Text style={styles.mutedInline}> — &ldquo;{n.postSummary}&rdquo;</Text> : null}
              </Text>
              <Text style={styles.time}>{timeAgo(n.createdAt)}</Text>
            </View>
            {!n.read && <View style={styles.dot} />}
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: colors.ink, padding: 16, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.paper, borderRadius: radius.lg, padding: 12 },
  rowUnread: { backgroundColor: colors.accentSoft },
  text: { fontSize: 13, color: colors.ink },
  actor: { fontWeight: '700' },
  mutedInline: { color: colors.inkSoft },
  time: { fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  empty: { fontSize: 13, color: colors.inkSoft, textAlign: 'center', marginTop: 40, paddingHorizontal: 20 },
});
