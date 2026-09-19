import { View, Text, StyleSheet } from 'react-native';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../config/theme';

const EMPTY_TYPING = [];

export default function TypingIndicator({ conversationId }) {
  const typingUserIds = useChatStore((s) => s.typingByConversation[conversationId] || EMPTY_TYPING);
  const myId = useAuthStore((s) => s.user?.id);
  const others = typingUserIds.filter((id) => id !== myId);

  return (
    <View style={styles.wrap}>
      {others.length > 0 && <Text style={styles.text}>typing...</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 18, paddingHorizontal: 16 },
  text: { fontSize: 12, color: colors.inkSoft, fontStyle: 'italic' },
});
