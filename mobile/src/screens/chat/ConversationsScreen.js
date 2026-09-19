import { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, ScrollView } from 'react-native';
import Screen from '../../components/common/Screen';
import Avatar from '../../components/common/Avatar';
import ConversationItem from '../../components/chat/ConversationItem';
import ContactSearch from '../../components/chat/ContactSearch';
import ContactRequests from '../../components/chat/ContactRequests';
import ContactsList from '../../components/chat/ContactsList';
import CallHistoryList from '../../components/chat/CallHistoryList';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { fetchConversations, createConversation } from '../../api/chat.api';
import { colors, radius } from '../../config/theme';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'groups', label: 'Circles & Groups' },
  { id: 'calls', label: 'Calls' },
];

export default function ConversationsScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);

  const [tab, setTab] = useState('chats');
  const [filter, setFilter] = useState('all');
  const [contactsRefreshKey, setContactsRefreshKey] = useState(0);

  useEffect(() => {
    fetchConversations().then(setConversations);
  }, [setConversations]);

  const openConversation = (conversation) => {
    setActiveConversation(conversation.id);
    const isGroup = conversation.type === 'group';
    const title = isGroup ? conversation.name : conversation.participants.find((p) => p.id !== user.id)?.name;
    navigation.navigate('Chat', { conversationId: conversation.id, title, isGroup });
  };

  const startDirectChat = async (contact) => {
    const conversation = await createConversation({ type: 'direct', participantIds: [contact.id] });
    upsertConversation(conversation);
    setTab('chats');
    openConversation(conversation);
  };

  const filtered = conversations.filter((c) => {
    if (filter === 'groups') return c.type === 'group';
    if (filter === 'unread') return c.lastMessage && c.lastMessage.senderId !== user?.id;
    return true;
  });
  const unreadCount = conversations.filter((c) => c.lastMessage && c.lastMessage.senderId !== user?.id).length;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable style={styles.profileRow} onPress={() => navigation.getParent()?.navigate('ProfileTab')}>
          <Avatar user={user} size="sm" />
          <Text style={styles.headerName} numberOfLines={1}>
            {user?.name}
          </Text>
        </Pressable>
        <Pressable style={styles.groupButton} onPress={() => navigation.navigate('NewGroup')}>
          <Text style={styles.groupButtonText}>+ Group</Text>
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        <Pressable style={[styles.tab, tab === 'chats' && styles.tabActive]} onPress={() => setTab('chats')}>
          <Text style={[styles.tabText, tab === 'chats' && styles.tabTextActive]}>Chats</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'contacts' && styles.tabActive]} onPress={() => setTab('contacts')}>
          <Text style={[styles.tabText, tab === 'contacts' && styles.tabTextActive]}>Contacts</Text>
        </Pressable>
      </View>

      {tab === 'chats' ? (
        <>
          <View style={styles.conversationsHeader}>
            <Text style={styles.conversationsTitle}>Conversations</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount} UNREAD</Text>
              </View>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ gap: 6 }}>
            {FILTERS.map((f) => (
              <Pressable
                key={f.id}
                style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
                onPress={() => setFilter(f.id)}
              >
                <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {filter === 'calls' ? (
            <CallHistoryList
              onOpenConversation={(id) => {
                const conversation = conversations.find((c) => c.id === id);
                if (conversation) openConversation(conversation);
              }}
            />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(c) => c.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => <ConversationItem conversation={item} onPress={() => openConversation(item)} />}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  {filter === 'unread' ? 'Nothing unread.' : filter === 'groups' ? 'No groups yet.' : 'No chats yet. Add a contact to start one.'}
                </Text>
              }
            />
          )}
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          <ContactSearch />
          <ContactRequests onAccepted={() => setContactsRefreshKey((k) => k + 1)} />
          <ContactsList onStartChat={startDirectChat} refreshKey={contactsRefreshKey} />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerName: { fontSize: 16, fontWeight: '800', color: colors.ink, flexShrink: 1 },
  groupButton: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 6 },
  groupButtonText: { fontSize: 12, fontWeight: '600', color: colors.ink },
  tabRow: { flexDirection: 'row', padding: 8, gap: 4, borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radius.full, alignItems: 'center' },
  tabActive: { backgroundColor: colors.accentSoft },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.inkSoft },
  tabTextActive: { color: colors.accent },
  conversationsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  conversationsTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  unreadBadge: { backgroundColor: colors.accent, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  unreadBadgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 10, flexGrow: 0 },
  filterChip: { backgroundColor: colors.paperSoft, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  filterChipActive: { backgroundColor: colors.accent },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.inkSoft },
  filterChipTextActive: { color: colors.white },
  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { fontSize: 13, color: colors.inkSoft, textAlign: 'center', paddingVertical: 24 },
});
