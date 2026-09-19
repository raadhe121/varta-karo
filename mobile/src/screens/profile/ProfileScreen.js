import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, FlatList, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import Screen from '../../components/common/Screen';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import FriendButton from '../../components/social/FriendButton';
import FollowButton from '../../components/social/FollowButton';
import PostCard from '../../components/social/PostCard';
import ActivityLog from '../../components/social/ActivityLog';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { fetchProfile } from '../../api/social.api';
import { fetchUserPosts } from '../../api/posts.api';
import { colors, radius } from '../../config/theme';

export default function ProfileScreen({ route, navigation }) {
  const myId = useAuthStore((s) => s.user?.id);
  const { logout } = useAuth();
  const targetId = route.params?.userId || myId;

  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('posts');
  const [posts, setPosts] = useState(null);

  const load = useCallback(() => fetchProfile(targetId).then(setProfile), [targetId]);

  useFocusEffect(
    useCallback(() => {
      setProfile(null);
      setPosts(null);
      setTab('posts');
      load();
    }, [load])
  );

  useEffect(() => {
    if ((tab === 'posts' || tab === 'media') && profile) {
      fetchUserPosts(targetId).then(setPosts);
    }
  }, [tab, profile, targetId]);

  if (!profile) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    );
  }

  const mediaPosts = (posts || []).filter((p) => p.imageUrl);
  const totalCircle = profile.friendCount + profile.followerCount;
  const closeCirclePct = totalCircle > 0 ? Math.round((profile.friendCount / totalCircle) * 100) : 0;

  return (
    <Screen>
      <FlatList
        data={tab === 'posts' ? posts || [] : []}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <PostCard post={item} onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))} />
          </View>
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.cover}>
              {profile.coverPhotoUrl ? <Image source={{ uri: profile.coverPhotoUrl }} style={styles.coverImage} /> : null}
            </View>

            <View style={styles.headerBlock}>
              <View style={styles.avatarRow}>
                <Avatar user={profile} size="lg" />
                {profile.isSelf ? (
                  <Button title="Edit profile" variant="outline" onPress={() => navigation.navigate('EditProfile')} />
                ) : (
                  <View style={{ gap: 8 }}>
                    <FriendButton profile={profile} onChange={load} />
                    <FollowButton profile={profile} onChange={load} />
                  </View>
                )}
              </View>

              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.username}>@{profile.username}</Text>
              {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

              <View style={styles.statsRow}>
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>{profile.friendCount}</Text> friends
                </Text>
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>{profile.followerCount}</Text> followers
                </Text>
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>{profile.followingCount}</Text> following
                </Text>
              </View>

              <View style={styles.aboutCard}>
                <Text style={styles.aboutLabel}>Intro &amp; Archive Details</Text>
                {profile.about ? (
                  <View style={{ gap: 4 }}>
                    {profile.about.work ? <Text style={styles.aboutLine}>💼 {profile.about.work}</Text> : null}
                    {profile.about.education ? <Text style={styles.aboutLine}>🎓 {profile.about.education}</Text> : null}
                    {profile.about.location ? <Text style={styles.aboutLine}>📍 {profile.about.location}</Text> : null}
                    {(profile.about.links || []).map((l) => (
                      <Pressable key={l.url} onPress={() => Linking.openURL(l.url)}>
                        <Text style={[styles.aboutLine, styles.link]}>🔗 {l.label}</Text>
                      </Pressable>
                    ))}
                    {!profile.about.work && !profile.about.education && !profile.about.location && (profile.about.links || []).length === 0 && (
                      <Text style={styles.mutedText}>Nothing added yet.</Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.mutedText}>This person&apos;s info is private.</Text>
                )}
              </View>

              {totalCircle > 0 && (
                <View style={styles.aboutCard}>
                  <Text style={styles.aboutLabel}>Social Graph</Text>
                  <View style={styles.graphTrack}>
                    <View style={[styles.graphFill, { width: `${closeCirclePct}%` }]} />
                  </View>
                  <View style={styles.graphLegend}>
                    <Text style={styles.mutedText}>Friends ({closeCirclePct}%)</Text>
                    <Text style={styles.mutedText}>Followers ({100 - closeCirclePct}%)</Text>
                  </View>
                </View>
              )}

              <View style={styles.tabRow}>
                <Pressable onPress={() => setTab('posts')} style={styles.tabItem}>
                  <Text style={[styles.tabText, tab === 'posts' && styles.tabTextActive]}>Timeline &amp; Letters</Text>
                </Pressable>
                <Pressable onPress={() => setTab('media')} style={styles.tabItem}>
                  <Text style={[styles.tabText, tab === 'media' && styles.tabTextActive]}>Media &amp; Folio</Text>
                </Pressable>
                {profile.isSelf && (
                  <Pressable onPress={() => setTab('activity')} style={styles.tabItem}>
                    <Text style={[styles.tabText, tab === 'activity' && styles.tabTextActive]}>Activity Log</Text>
                  </Pressable>
                )}
              </View>

              {profile.isSelf && (
                <Pressable onPress={logout} style={{ marginTop: 16 }}>
                  <Text style={styles.logout}>Log out</Text>
                </Pressable>
              )}
            </View>

            {tab === 'posts' && posts === null && <ActivityIndicator style={{ marginTop: 20 }} color={colors.accent} />}
            {tab === 'posts' && posts?.length === 0 && <Text style={styles.mutedCentered}>No posts yet.</Text>}

            {tab === 'media' && (
              <View style={styles.mediaGrid}>
                {mediaPosts.length === 0 ? (
                  <Text style={styles.mutedCentered}>No photos yet.</Text>
                ) : (
                  mediaPosts.map((p) => <Image key={p.id} source={{ uri: p.imageUrl }} style={styles.mediaImage} />)
                )}
              </View>
            )}

            {tab === 'activity' && (
              <View style={{ paddingHorizontal: 16 }}>
                <ActivityLog />
              </View>
            )}
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { height: 140, backgroundColor: colors.paperSoft },
  coverImage: { width: '100%', height: '100%' },
  headerBlock: { paddingHorizontal: 16, marginTop: -32 },
  avatarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  name: { fontSize: 20, fontWeight: '800', color: colors.ink },
  username: { fontSize: 13, color: colors.inkSoft },
  bio: { fontSize: 13, color: colors.ink, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 10 },
  statText: { fontSize: 13, color: colors.inkSoft },
  statNumber: { fontWeight: '800', color: colors.ink },
  aboutCard: { backgroundColor: colors.paper, borderRadius: radius.xl, padding: 14, marginTop: 12 },
  aboutLabel: { fontSize: 11, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 8 },
  aboutLine: { fontSize: 13, color: colors.ink },
  link: { color: colors.accent, textDecorationLine: 'underline' },
  mutedText: { fontSize: 13, color: colors.inkSoft },
  mutedCentered: { fontSize: 13, color: colors.inkSoft, textAlign: 'center', marginTop: 20 },
  graphTrack: { height: 8, borderRadius: 4, backgroundColor: colors.accentSoft, overflow: 'hidden', marginBottom: 6 },
  graphFill: { height: '100%', backgroundColor: colors.accent },
  graphLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  tabRow: { flexDirection: 'row', gap: 16, borderBottomWidth: 1, borderBottomColor: colors.line, marginTop: 16, paddingBottom: 10 },
  tabItem: {},
  tabText: { fontSize: 13, color: colors.inkSoft, fontWeight: '600' },
  tabTextActive: { color: colors.accent, fontWeight: '800' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 16 },
  mediaImage: { width: '31.5%', aspectRatio: 1, borderRadius: radius.sm },
  logout: { color: colors.inkSoft, fontSize: 13 },
});
