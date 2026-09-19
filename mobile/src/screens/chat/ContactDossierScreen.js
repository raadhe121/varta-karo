import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Screen from '../../components/common/Screen';
import Avatar from '../../components/common/Avatar';
import { fetchProfile } from '../../api/social.api';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import { startCall } from '../../call/webrtc';
import { colors, radius } from '../../config/theme';
import { API_ORIGIN } from '../../config/env';

function GroupInfo({ conversation }) {
  const navigation = useNavigation();
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerBlock}>
        <Avatar user={{ name: conversation.name, avatarUrl: conversation.avatarUrl }} size="lg" />
        <Text style={styles.name}>{conversation.name}</Text>
        <Text style={styles.username}>{conversation.participants.length} members</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Members</Text>
        {conversation.participants.map((p) => (
          <Pressable key={p.id} style={styles.memberRow} onPress={() => navigation.navigate('Profile', { userId: p.id })}>
            <Avatar user={p} size="sm" />
            <Text style={styles.memberName}>{p.name}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const EMPTY_MESSAGES = [];

function InertToggle({ label }) {
  const [on, setOn] = useState(false);
  return (
    <Pressable style={styles.toggleRow} onPress={() => setOn((v) => !v)}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={[styles.toggleTrack, on && styles.toggleTrackOn]}>
        <View style={[styles.toggleThumb, on && styles.toggleThumbOn]} />
      </View>
    </Pressable>
  );
}

export default function ContactDossierScreen({ route }) {
  const { conversationId } = route.params;
  const myId = useAuthStore((s) => s.user?.id);
  const conversation = useChatStore((s) => s.conversations.find((c) => c.id === conversationId));
  const messages = useChatStore((s) => s.messagesByConversation[conversationId] || EMPTY_MESSAGES);
  const [profile, setProfile] = useState(null);
  const callPhase = useCallStore((s) => s.phase);

  const other = conversation?.participants.find((p) => p.id !== myId);
  const canCall = callPhase === 'idle';

  useEffect(() => {
    if (other?.id) fetchProfile(other.id).then(setProfile);
  }, [other?.id]);

  const call = (callType) => {
    if (!canCall || !other) return;
    startCall({ toUserId: other.id, conversationId, callType, remoteUser: other });
  };

  const sharedImages = messages.filter((m) => m.type === 'image' && m.mediaUrl);

  if (conversation?.type === 'group') {
    return (
      <Screen>
        <GroupInfo conversation={conversation} />
      </Screen>
    );
  }

  if (!other) return <Screen />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>CONTACT DOSSIER</Text>
        <View style={styles.headerBlock}>
          <Avatar user={other} size="lg" />
          <Text style={styles.name}>{other.name}</Text>
          <Text style={styles.username}>@{other.username}</Text>
          {other.bio ? <Text style={styles.bio}>{other.bio}</Text> : null}
        </View>

        <View style={styles.callRow}>
          <Pressable style={[styles.callButton, !canCall && styles.callButtonDisabled]} disabled={!canCall} onPress={() => call('audio')}>
            <Text style={styles.callButtonText}>📞 Audio</Text>
          </Pressable>
          <Pressable style={[styles.callButton, !canCall && styles.callButtonDisabled]} disabled={!canCall} onPress={() => call('video')}>
            <Text style={styles.callButtonText}>🎥 Video</Text>
          </Pressable>
        </View>

        {profile && (
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              <Text style={styles.statsNumber}>{profile.friendCount}</Text> friends
            </Text>
            <Text style={styles.statsText}>
              <Text style={styles.statsNumber}>{profile.followerCount}</Text> followers
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Shared photos ({sharedImages.length})</Text>
          {sharedImages.length === 0 ? (
            <Text style={styles.empty}>No photos shared yet.</Text>
          ) : (
            <View style={styles.grid}>
              {sharedImages.slice(-9).map((m) => (
                <Image
                  key={m.id}
                  source={{ uri: m.mediaUrl.startsWith('http') ? m.mediaUrl : `${API_ORIGIN}${m.mediaUrl}` }}
                  style={styles.gridImage}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <InertToggle label="Disappearing messages" />
          <InertToggle label="Mute notifications" />
        </View>

        <Text style={styles.blockText}>Block {other.name}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20 },
  eyebrow: { fontSize: 11, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 16 },
  headerBlock: { alignItems: 'center', marginBottom: 16 },
  name: { fontSize: 18, fontWeight: '800', color: colors.ink, marginTop: 10 },
  username: { fontSize: 13, color: colors.inkSoft },
  bio: { fontSize: 13, color: colors.ink, marginTop: 8, textAlign: 'center' },
  callRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  callButton: { flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingVertical: 10, alignItems: 'center' },
  callButtonDisabled: { opacity: 0.4 },
  callButtonText: { fontSize: 13, color: colors.inkSoft, fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 16 },
  statsText: { fontSize: 13, color: colors.inkSoft },
  statsNumber: { fontWeight: '800', color: colors.ink },
  section: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 16, marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.inkSoft, textTransform: 'uppercase', marginBottom: 10 },
  empty: { fontSize: 13, color: colors.inkSoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gridImage: { width: '31%', aspectRatio: 1, borderRadius: radius.sm },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  toggleLabel: { fontSize: 14, color: colors.ink },
  toggleTrack: { width: 40, height: 22, borderRadius: 11, backgroundColor: colors.line, justifyContent: 'center' },
  toggleTrackOn: { backgroundColor: colors.accent },
  toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.paper, marginLeft: 2 },
  toggleThumbOn: { marginLeft: 20 },
  blockText: { color: colors.danger, fontSize: 14, marginTop: 12, opacity: 0.7 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  memberName: { fontSize: 14, color: colors.ink },
});
