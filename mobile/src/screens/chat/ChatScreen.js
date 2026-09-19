import { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import Screen from '../../components/common/Screen';
import MessageBubble from '../../components/chat/MessageBubble';
import MessageInput from '../../components/chat/MessageInput';
import TypingIndicator from '../../components/chat/TypingIndicator';
import { fetchMessages } from '../../api/chat.api';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { usePresenceStore } from '../../store/presenceStore';
import { useCallStore } from '../../store/callStore';
import { startCall } from '../../call/webrtc';
import { getSocket } from '../../socket/socket';
import { colors, radius } from '../../config/theme';

const EMPTY_MESSAGES = [];

export default function ChatScreen({ route, navigation }) {
  const { conversationId, title, isGroup } = route.params;
  const messages = useChatStore((s) => s.messagesByConversation[conversationId] || EMPTY_MESSAGES);
  const setMessages = useChatStore((s) => s.setMessages);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const conversation = useChatStore((s) => s.conversations.find((c) => c.id === conversationId));
  const myId = useAuthStore((s) => s.user?.id);
  const presence = usePresenceStore((s) => s.byUserId);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const listRef = useRef(null);
  const callPhase = useCallStore((s) => s.phase);

  const other = !isGroup ? conversation?.participants.find((p) => p.id !== myId) : null;
  const status = isGroup
    ? `${conversation?.participants.length || 0} members`
    : presence[other?.id]?.status === 'online'
      ? 'online'
      : 'offline';

  const canCall = !isGroup && callPhase === 'idle' && Boolean(other);
  const call = (callType) => {
    if (!canCall) return;
    startCall({ toUserId: other.id, conversationId, callType, remoteUser: other });
  };

  useEffect(() => {
    navigation.setOptions({
      title,
      headerRight: () => (
        <View style={styles.headerActions}>
          <Pressable style={styles.headerIcon} disabled={!canCall} onPress={() => call('audio')}>
            <Text style={{ opacity: canCall ? 1 : 0.4 }}>📞</Text>
          </Pressable>
          <Pressable style={styles.headerIcon} disabled={!canCall} onPress={() => call('video')}>
            <Text style={{ opacity: canCall ? 1 : 0.4 }}>🎥</Text>
          </Pressable>
          <Pressable style={styles.headerIcon} onPress={() => navigation.navigate('ContactDossier', { conversationId })}>
            <Text>ℹ️</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, title, isGroup, other, conversationId, canCall]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setHasMore(true);
    fetchMessages(conversationId).then((data) => {
      if (cancelled) return;
      setMessages(conversationId, data);
      setHasMore(data.length >= 30);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [conversationId, setMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.senderId !== myId) {
      socket.emit('message:read', { conversationId, messageId: last.id });
    }
  }, [conversationId, messages, myId]);

  const loadMore = async () => {
    if (messages.length === 0) return;
    setLoadingMore(true);
    const older = await fetchMessages(conversationId, messages[0].createdAt);
    prependMessages(conversationId, older);
    setHasMore(older.length >= 30);
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => (
            <MessageBubble message={item} showSender={isGroup && messages[index - 1]?.senderId !== item.senderId} />
          )}
          ListHeaderComponent={
            hasMore ? (
              <Pressable onPress={loadMore} disabled={loadingMore} style={styles.loadMore}>
                <Text style={styles.loadMoreText}>{loadingMore ? 'Loading...' : 'Load earlier messages'}</Text>
              </Pressable>
            ) : null
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
        <TypingIndicator conversationId={conversationId} />
        <MessageInput conversationId={conversationId} />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusBar: { paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.paper },
  statusText: { fontSize: 12, color: colors.inkSoft },
  listContent: { padding: 16 },
  loadMore: { alignSelf: 'center', marginBottom: 12 },
  loadMoreText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 12, marginRight: 8 },
  headerIcon: { padding: 4 },
});
