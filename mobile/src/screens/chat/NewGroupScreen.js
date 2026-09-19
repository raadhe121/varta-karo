import { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import Screen from '../../components/common/Screen';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import { fetchContacts } from '../../api/contacts.api';
import { createConversation } from '../../api/chat.api';
import { useChatStore } from '../../store/chatStore';
import { colors, radius } from '../../config/theme';

export default function NewGroupScreen({ navigation }) {
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchContacts().then(setContacts);
  }, []);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const submit = async () => {
    if (selected.size < 2 || !name) return;
    setLoading(true);
    try {
      const conversation = await createConversation({ type: 'group', name, participantIds: Array.from(selected) });
      upsertConversation(conversation);
      setActiveConversation(conversation.id);
      navigation.goBack();
      navigation.navigate('Chat', { conversationId: conversation.id, title: conversation.name });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>New group</Text>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
        <Input placeholder="Group name" value={name} onChangeText={setName} style={{ marginBottom: 12 }} />
        <Text style={styles.hint}>Pick at least 2 contacts</Text>
        <FlatList
          data={contacts}
          keyExtractor={(u) => u.id}
          style={{ marginTop: 8 }}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => toggle(item.id)}>
              <View style={[styles.checkbox, selected.has(item.id) && styles.checkboxChecked]} />
              <Avatar user={item} size="sm" />
              <Text style={styles.name}>{item.name}</Text>
            </Pressable>
          )}
        />
        <Button
          title={loading ? 'Creating...' : 'Create group'}
          onPress={submit}
          loading={loading}
          disabled={selected.size < 2 || !name}
          style={{ marginTop: 12 }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  close: { color: colors.accent, fontWeight: '600' },
  body: { flex: 1, padding: 16 },
  hint: { fontSize: 12, color: colors.inkSoft },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.line },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  name: { fontSize: 14, color: colors.ink },
});
