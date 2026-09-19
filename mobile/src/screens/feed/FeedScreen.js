import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import Screen from '../../components/common/Screen';
import PostComposer from '../../components/social/PostComposer';
import PostCard from '../../components/social/PostCard';
import StoriesRow from '../../components/social/StoriesRow';
import ActiveFriends from '../../components/social/ActiveFriends';
import { fetchFeed } from '../../api/posts.api';
import { colors, radius } from '../../config/theme';

export default function FeedScreen() {
  const [posts, setPosts] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    fetchFeed().then((data) => {
      setPosts(data);
      setHasMore(data.length >= 20);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!posts || posts.length === 0 || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const older = await fetchFeed(posts[posts.length - 1].createdAt);
    setPosts((prev) => [...prev, ...older]);
    setHasMore(older.length >= 20);
    setLoadingMore(false);
  };

  return (
    <Screen>
      <FlatList
        data={posts || []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.content}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListHeaderComponent={
          <View>
            <View style={styles.storiesCard}>
              <Text style={styles.storiesLabel}>Stories</Text>
              <StoriesRow />
            </View>
            <PostComposer onCreated={(post) => setPosts((prev) => [post, ...(prev || [])])} />
            <ActiveFriends />
          </View>
        }
        renderItem={({ item }) => (
          <PostCard post={item} onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))} />
        )}
        ListEmptyComponent={
          posts === null ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent} />
          ) : (
            <Text style={styles.empty}>No posts yet. Friend or follow someone, or share your first post above.</Text>
          )
        }
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={colors.accent} /> : null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  storiesCard: { backgroundColor: colors.paper, borderRadius: radius.xl, padding: 14, marginBottom: 12 },
  storiesLabel: { fontSize: 11, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 10 },
  empty: { fontSize: 13, color: colors.inkSoft, textAlign: 'center', marginTop: 40, paddingHorizontal: 20 },
});
