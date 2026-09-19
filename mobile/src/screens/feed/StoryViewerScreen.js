import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import Avatar from '../../components/common/Avatar';
import { viewStory, deleteStory, fetchStoryViewers } from '../../api/stories.api';
import { useAuthStore } from '../../store/authStore';
import { API_ORIGIN } from '../../config/env';

const IMAGE_DURATION = 5000;

function mediaUri(path) {
  return path?.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

function timeAgo(dateStr) {
  const diffMin = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  return `${Math.floor(diffMin / 60)}h`;
}

export default function StoryViewerScreen({ route, navigation }) {
  const { groups, startGroupIndex } = route.params;
  const myUserId = useAuthStore((s) => s.user?.id);

  const [groupIndex, setGroupIndex] = useState(startGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [viewers, setViewers] = useState(null);
  const [showViewers, setShowViewers] = useState(false);
  const rafRef = useRef(null);
  const pollRef = useRef(null);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const isMine = story?.authorId === myUserId;
  const isVideo = story?.mediaType === 'video';

  const player = useVideoPlayer(isVideo ? mediaUri(story.mediaUrl) : null, (p) => {
    p.loop = false;
    p.play();
  });

  const goNext = useCallback(() => {
    setShowViewers(false);
    setViewers(null);
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((g) => g + 1);
      setStoryIndex(0);
    } else {
      navigation.goBack();
    }
  }, [group, storyIndex, groupIndex, groups.length, navigation]);

  const goPrev = useCallback(() => {
    setShowViewers(false);
    setViewers(null);
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      setStoryIndex(groups[groupIndex - 1].stories.length - 1);
      setGroupIndex((g) => g - 1);
    } else {
      navigation.goBack();
    }
  }, [storyIndex, groupIndex, groups, navigation]);

  useEffect(() => {
    if (story && !isMine && !story.viewedByMe) {
      viewStory(story.id).catch(() => {});
    }
  }, [story, isMine]);

  useEffect(() => {
    setProgress(0);
    cancelAnimationFrame(rafRef.current);
    clearInterval(pollRef.current);
    if (!story) return undefined;

    if (isVideo) {
      pollRef.current = setInterval(() => {
        const duration = player.duration;
        if (duration > 0) {
          const pct = (player.currentTime / duration) * 100;
          setProgress(pct);
          if (pct >= 99.5) goNext();
        }
      }, 200);
      return () => clearInterval(pollRef.current);
    }

    const start = Date.now();
    const tick = () => {
      const pct = Math.min(100, ((Date.now() - start) / IMAGE_DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) {
        goNext();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  const openViewers = async () => {
    setShowViewers((s) => !s);
    if (!viewers) setViewers(await fetchStoryViewers(story.id));
  };

  const handleDelete = async () => {
    await deleteStory(story.id);
    navigation.goBack();
  };

  if (!group || !story) return null;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.progressRow}>
        {group.stories.map((s, i) => (
          <View key={s.id} style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${i < storyIndex ? 100 : i === storyIndex ? progress : 0}%` }]}
            />
          </View>
        ))}
      </View>

      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Avatar user={group.author} size="sm" />
          <Text style={styles.headerName}>{group.author.name}</Text>
          <Text style={styles.headerTime}>{timeAgo(story.createdAt)}</Text>
        </View>
        <View style={styles.headerRight}>
          {isMine && (
            <Pressable onPress={handleDelete}>
              <Text style={styles.headerAction}>Delete</Text>
            </Pressable>
          )}
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.close}>×</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.mediaWrap}>
        {isVideo ? (
          <VideoView player={player} style={styles.media} contentFit="contain" nativeControls={false} />
        ) : (
          <Image source={{ uri: mediaUri(story.mediaUrl) }} style={styles.media} resizeMode="contain" />
        )}
      </View>

      {story.caption ? (
        <View style={styles.captionBox}>
          <Text style={styles.captionText}>{story.caption}</Text>
        </View>
      ) : null}

      {isMine && (
        <Pressable style={styles.viewersButton} onPress={openViewers}>
          <Text style={styles.viewersButtonText}>👁 Viewers{viewers ? ` (${viewers.length})` : ''}</Text>
        </Pressable>
      )}

      {showViewers && (
        <View style={styles.viewersPanel}>
          <Text style={styles.viewersTitle}>VIEWERS</Text>
          {viewers === null ? (
            <Text style={styles.viewersEmpty}>Loading...</Text>
          ) : viewers.length === 0 ? (
            <Text style={styles.viewersEmpty}>No views yet.</Text>
          ) : (
            viewers.map((v) => (
              <View key={v.id} style={styles.viewerRow}>
                <Avatar user={v} size="sm" />
                <Text style={styles.viewerName}>{v.name}</Text>
              </View>
            ))
          )}
        </View>
      )}

      <Pressable style={styles.tapPrev} onPress={goPrev} />
      <Pressable style={styles.tapNext} onPress={goNext} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 8, paddingTop: 8 },
  progressTrack: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  headerTime: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  headerAction: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  close: { color: '#fff', fontSize: 26, lineHeight: 28 },
  mediaWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  media: { width: '100%', height: '100%' },
  captionBox: {
    position: 'absolute',
    bottom: 70,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    padding: 10,
  },
  captionText: { color: '#fff', fontSize: 14 },
  viewersButton: { position: 'absolute', bottom: 20, left: 12 },
  viewersButtonText: { color: '#fff', fontSize: 12 },
  viewersPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 260,
    backgroundColor: 'rgba(10,10,10,0.95)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  viewersTitle: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', marginBottom: 8 },
  viewersEmpty: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  viewerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  viewerName: { color: '#fff', fontSize: 13 },
  tapPrev: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%' },
  tapNext: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%' },
});
