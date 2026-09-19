import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Avatar from '../common/Avatar';
import Input from '../common/Input';
import { searchUsers, sendContactRequest } from '../../api/contacts.api';
import { colors, radius } from '../../config/theme';

export default function ContactSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [sentTo, setSentTo] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const runSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      setResults(await searchUsers(q));
    } finally {
      setLoading(false);
    }
  };

  const addContact = async (userId) => {
    try {
      await sendContactRequest(userId);
    } finally {
      setSentTo((prev) => new Set(prev).add(userId));
    }
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Input placeholder="Search by name, username, email or phone" value={query} onChangeText={runSearch} autoCapitalize="none" />
      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
      {results.map((user) => (
        <View key={user.id} style={styles.row}>
          <Avatar user={user} size="sm" />
          <View style={styles.textCol}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.username}>@{user.username}</Text>
          </View>
          <Pressable
            style={[styles.addButton, sentTo.has(user.id) && styles.addButtonSent]}
            disabled={sentTo.has(user.id)}
            onPress={() => addContact(user.id)}
          >
            <Text style={styles.addButtonText}>{sentTo.has(user.id) ? 'Sent' : 'Add'}</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  textCol: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: colors.ink },
  username: { fontSize: 12, color: colors.inkSoft },
  addButton: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 6 },
  addButtonSent: { opacity: 0.5 },
  addButtonText: { fontSize: 12, fontWeight: '600', color: colors.ink },
});
