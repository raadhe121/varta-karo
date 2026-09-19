import { useState } from 'react';
import { View, Text, TextInput, Image, Pressable, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { createPost } from '../../api/posts.api';
import { uploadMedia } from '../../api/chat.api';
import Button from '../common/Button';
import { colors, radius } from '../../config/theme';
import { API_ORIGIN } from '../../config/env';

const VISIBILITY_OPTIONS = [
  { id: 'public', label: 'Public' },
  { id: 'friends', label: 'Friends' },
  { id: 'only_me', label: 'Only me' },
];

function mediaUri(path) {
  return path?.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

export default function PostComposer({ onCreated }) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [imageUrl, setImageUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const player = useVideoPlayer(mediaType === 'video' ? mediaUri(imageUrl) : null, (p) => {
    p.loop = true;
  });

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');
    setUploading(true);
    try {
      const uploaded = await uploadMedia({
        uri: asset.uri,
        name: asset.fileName || (isVideo ? 'video.mp4' : 'photo.jpg'),
        type: asset.mimeType || (isVideo ? 'video/mp4' : 'image/jpeg'),
      });
      setImageUrl(uploaded.url);
      setMediaType(isVideo ? 'video' : 'image');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!content.trim() && !imageUrl) return;
    setPosting(true);
    try {
      const post = await createPost({ content: content.trim() || undefined, imageUrl, mediaType, visibility });
      onCreated(post);
      setContent('');
      setImageUrl(null);
      setMediaType(null);
      setVisibility('public');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={styles.card}>
      <TextInput
        style={styles.textarea}
        placeholder="What's on your mind?"
        placeholderTextColor={colors.inkSoft}
        value={content}
        onChangeText={setContent}
        multiline
      />
      {imageUrl && (
        <View style={{ marginBottom: 10 }}>
          {mediaType === 'video' ? (
            <VideoView player={player} style={styles.preview} contentFit="cover" />
          ) : (
            <Image source={{ uri: mediaUri(imageUrl) }} style={styles.preview} />
          )}
          <Pressable
            style={styles.removeImage}
            onPress={() => {
              setImageUrl(null);
              setMediaType(null);
            }}
          >
            <Text style={styles.removeImageText}>×</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.footerRow}>
        <View style={styles.footerLeft}>
          <Pressable style={styles.iconButton} onPress={pickImage} disabled={uploading}>
            <Text>{uploading ? '...' : '📷'}</Text>
          </Pressable>
          <View style={styles.visibilityRow}>
            {VISIBILITY_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                style={[styles.visibilityChip, visibility === opt.id && styles.visibilityChipActive]}
                onPress={() => setVisibility(opt.id)}
              >
                <Text style={[styles.visibilityChipText, visibility === opt.id && styles.visibilityChipTextActive]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Button title={posting ? 'Posting...' : 'Post'} onPress={submit} loading={posting} disabled={!content.trim() && !imageUrl} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.paper, borderRadius: radius.xl, padding: 14, marginBottom: 12 },
  textarea: { fontSize: 15, color: colors.ink, minHeight: 60, textAlignVertical: 'top', marginBottom: 10 },
  preview: { width: '100%', height: 180, borderRadius: radius.md },
  removeImage: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  removeImageText: { color: colors.white, fontSize: 14, lineHeight: 16 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  iconButton: { width: 36, height: 36, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  visibilityRow: { flexDirection: 'row', gap: 4 },
  visibilityChip: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.paperSoft },
  visibilityChipActive: { backgroundColor: colors.accent },
  visibilityChipText: { fontSize: 11, color: colors.inkSoft, fontWeight: '600' },
  visibilityChipTextActive: { color: colors.white },
});
