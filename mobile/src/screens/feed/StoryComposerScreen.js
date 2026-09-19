import { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { createStory } from '../../api/stories.api';
import { API_ORIGIN } from '../../config/env';
import { colors } from '../../config/theme';

function mediaUri(path) {
  return path?.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

export default function StoryComposerScreen({ route, navigation }) {
  const { mediaUrl, mediaType } = route.params;
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const player = useVideoPlayer(mediaType === 'video' ? mediaUri(mediaUrl) : null, (p) => {
    p.loop = true;
    p.play();
  });

  const share = async () => {
    setPosting(true);
    try {
      await createStory({ mediaUrl, mediaType, caption: caption.trim() || undefined });
      navigation.goBack();
    } finally {
      setPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} disabled={posting}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>New Story</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.mediaWrap}>
        {mediaType === 'video' ? (
          <VideoView player={player} style={styles.media} contentFit="contain" nativeControls={false} />
        ) : (
          <Image source={{ uri: mediaUri(mediaUrl) }} style={styles.media} resizeMode="contain" />
        )}
      </View>

      <View style={styles.footer}>
        <Input placeholder="Add a caption (optional)" value={caption} onChangeText={setCaption} />
        <Button title={posting ? 'Sharing...' : 'Share to Story'} onPress={share} loading={posting} style={{ marginTop: 12 }} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  cancel: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  title: { color: '#fff', fontSize: 15, fontWeight: '700' },
  mediaWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  media: { width: '100%', height: '100%' },
  footer: { padding: 16, backgroundColor: colors.paper },
});
