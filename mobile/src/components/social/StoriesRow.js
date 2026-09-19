import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { fetchFeedStories } from '../../api/stories.api';
import { uploadMedia } from '../../api/chat.api';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../common/Avatar';
import { colors, radius } from '../../config/theme';

export default function StoriesRow() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const [groups, setGroups] = useState([]);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    fetchFeedStories().then(setGroups);
  }, []);

  useFocusEffect(load);

  const myGroupIndex = groups.findIndex((g) => g.author.id === user?.id);
  const myGroup = myGroupIndex >= 0 ? groups[myGroupIndex] : null;

  const openViewer = (index) => {
    navigation.navigate('StoryViewer', { groups, startGroupIndex: index });
  };

  const pickAndCompose = async () => {
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
      navigation.navigate('StoryComposer', { mediaUrl: uploaded.url, mediaType: isVideo ? 'video' : 'image' });
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarPress = () => {
    if (myGroup) {
      openViewer(myGroupIndex);
    } else {
      pickAndCompose();
    }
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Pressable style={styles.item} onPress={handleAvatarPress} disabled={uploading}>
        <View>
          <View style={myGroup ? styles.ring : undefined}>
            <Avatar user={user} size="md" />
          </View>
          <Pressable style={styles.addBadge} onPress={pickAndCompose} hitSlop={8}>
            <Text style={styles.addBadgeText}>{uploading ? '…' : '+'}</Text>
          </Pressable>
        </View>
        <Text style={styles.label} numberOfLines={1}>
          Your story
        </Text>
      </Pressable>

      {groups
        .filter((g) => g.author.id !== user?.id)
        .map((g) => {
          const allSeen = g.stories.every((s) => s.viewedByMe);
          return (
            <Pressable
              key={g.author.id}
              style={styles.item}
              onPress={() => openViewer(groups.findIndex((gr) => gr.author.id === g.author.id))}
            >
              <View style={[styles.ring, allSeen && styles.ringSeen]}>
                <Avatar user={g.author} size="md" />
              </View>
              <Text style={styles.label} numberOfLines={1}>
                {g.author.name.split(' ')[0]}
              </Text>
            </Pressable>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 16 },
  item: { alignItems: 'center', width: 60 },
  ring: { borderWidth: 2, borderColor: colors.accent, borderRadius: 999, padding: 2 },
  ringSeen: { borderColor: colors.line },
  addBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBadgeText: { color: colors.white, fontSize: 11, fontWeight: '700', lineHeight: 12 },
  label: { fontSize: 11, color: colors.inkSoft, marginTop: 6 },
});
