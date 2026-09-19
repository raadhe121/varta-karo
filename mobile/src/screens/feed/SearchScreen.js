import { useState } from 'react';
import { View, Pressable, Text, FlatList, StyleSheet } from 'react-native';
import Screen from '../../components/common/Screen';
import Input from '../../components/common/Input';
import Avatar from '../../components/common/Avatar';
import { searchUsers } from '../../api/contacts.api';
import { colors } from '../../config/theme';

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const runSearch = async (q) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setResults(await searchUsers(q));
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Input
          placeholder="Search people..."
          value={query}
          onChangeText={runSearch}
          autoCapitalize="none"
          autoFocus
          style={{ flex: 1 }}
        />
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </View>
      <FlatList
        data={results}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => navigation.replace('Profile', { userId: item.id })}>
            <Avatar user={item} size="sm" />
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.username}>@{item.username}</Text>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  cancel: { color: colors.accent, fontWeight: '600' },
  list: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  name: { fontSize: 14, fontWeight: '600', color: colors.ink },
  username: { fontSize: 12, color: colors.inkSoft },
});
