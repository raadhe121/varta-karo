import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchFriends } from '../../api/social.api';
import Avatar from '../common/Avatar';
import { colors, radius } from '../../config/theme';

export default function ActiveFriends() {
  const navigation = useNavigation();
  const [friends, setFriends] = useState(null);

  useEffect(() => {
    fetchFriends().then(setFriends);
  }, []);

  if (!friends) return null;
  const online = friends.filter((f) => f.status === 'online');
  if (online.length === 0) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Friends</Text>
        <Text style={styles.count}>{online.length} online</Text>
      </View>
      {online.map((f) => (
        <Pressable key={f.id} style={styles.row} onPress={() => navigation.navigate('Profile', { userId: f.id })}>
          <Avatar user={f} size="sm" showStatus isOnline />
          <Text style={styles.name}>{f.name}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.paper, borderRadius: radius.xl, padding: 14, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 14, fontWeight: '800', color: colors.ink },
  count: { fontSize: 12, color: colors.inkSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  name: { fontSize: 13, fontWeight: '600', color: colors.ink },
});
