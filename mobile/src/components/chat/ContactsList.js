import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Avatar from '../common/Avatar';
import { fetchContacts } from '../../api/contacts.api';
import { usePresenceStore } from '../../store/presenceStore';
import { colors } from '../../config/theme';

export default function ContactsList({ onStartChat, refreshKey }) {
  const [contacts, setContacts] = useState([]);
  const isOnline = usePresenceStore((s) => s.isOnline);
  const seedFromUsers = usePresenceStore((s) => s.seedFromUsers);

  useEffect(() => {
    fetchContacts().then((list) => {
      setContacts(list);
      seedFromUsers(list);
    });
  }, [refreshKey, seedFromUsers]);

  if (contacts.length === 0) {
    return <Text style={styles.empty}>No contacts yet. Search above to add someone.</Text>;
  }

  return (
    <View>
      <Text style={styles.sectionLabel}>Contacts</Text>
      {contacts.map((user) => (
        <Pressable key={user.id} style={styles.row} onPress={() => onStartChat(user)}>
          <Avatar user={user} size="sm" showStatus isOnline={isOnline(user.id)} />
          <View style={styles.textCol}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.username}>@{user.username}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  textCol: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: colors.ink },
  username: { fontSize: 12, color: colors.inkSoft },
  empty: { fontSize: 13, color: colors.inkSoft, paddingVertical: 16 },
});
