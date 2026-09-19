import { useRef, useState } from 'react';
import { View, TextInput, Pressable, Text, ScrollView, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getSocket } from '../../socket/socket';
import { uploadMedia } from '../../api/chat.api';
import { useChatStore } from '../../store/chatStore';
import { colors, radius } from '../../config/theme';

const TYPING_STOP_DELAY = 2000;
const QUICK_REPLIES = ['Sounds good 👍', 'On it', 'Got it', "Let's talk later"];

export default function MessageInput({ conversationId }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const typingTimeout = useRef(null);
  const addMessage = useChatStore((s) => s.addMessage);

  const emitTyping = (isTyping) => {
    const socket = getSocket();
    socket?.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
  };

  const handleChange = (value) => {
    setText(value);
    emitTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitTyping(false), TYPING_STOP_DELAY);
  };

  const send = (payload) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('message:send', { conversationId, ...payload }, (res) => {
      if (res?.message) addMessage(conversationId, res.message);
    });
  };

  const submit = () => {
    if (!text.trim()) return;
    send({ type: 'text', content: text.trim() });
    setText('');
    clearTimeout(typingTimeout.current);
    emitTyping(false);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const uploaded = await uploadMedia({
        uri: asset.uri,
        name: asset.fileName || 'photo.jpg',
        type: asset.mimeType || 'image/jpeg',
      });
      send({ type: 'image', mediaUrl: uploaded.url, mediaMeta: { originalName: uploaded.originalName } });
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
        <Text style={styles.quickLabel}>QUICK:</Text>
        {QUICK_REPLIES.map((reply) => (
          <Pressable key={reply} style={styles.chip} onPress={() => setText(reply)}>
            <Text style={styles.chipText}>{reply}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <Pressable style={styles.iconButton} onPress={pickImage} disabled={uploading}>
          <Text>{uploading ? '...' : '📎'}</Text>
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="Write something..."
          placeholderTextColor={colors.inkSoft}
          value={text}
          onChangeText={handleChange}
        />
        <Pressable style={styles.sendButton} onPress={submit}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paper },
  quickRow: { paddingHorizontal: 12, paddingTop: 10, gap: 8, alignItems: 'center' },
  quickLabel: { fontSize: 10, fontWeight: '700', color: colors.inkSoft, marginRight: 4 },
  chip: { borderWidth: 1, borderColor: colors.line, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, color: colors.ink },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  iconButton: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: colors.paper,
    color: colors.ink,
  },
  sendButton: { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 10 },
  sendText: { color: colors.white, fontWeight: '700' },
});
