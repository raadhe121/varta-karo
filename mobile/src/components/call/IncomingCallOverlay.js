import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useCallStore } from '../../store/callStore';
import { acceptCall, declineCall } from '../../call/webrtc';
import Avatar from '../common/Avatar';

export default function IncomingCallOverlay() {
  const phase = useCallStore((s) => s.phase);
  const remoteUser = useCallStore((s) => s.remoteUser);
  const callType = useCallStore((s) => s.callType);

  if (phase !== 'incoming') return null;

  return (
    <View style={styles.root}>
      <Avatar user={remoteUser} size="lg" />
      <Text style={styles.name}>{remoteUser?.name}</Text>
      <Text style={styles.subtitle}>Incoming {callType === 'video' ? 'video' : 'voice'} call...</Text>

      <View style={styles.actions}>
        <Pressable onPress={declineCall} style={[styles.button, styles.decline]}>
          <Text style={styles.buttonText}>✕</Text>
        </Pressable>
        <Pressable onPress={acceptCall} style={[styles.button, styles.accept]}>
          <Text style={styles.buttonText}>✓</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,17,13,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 100,
    elevation: 100,
  },
  name: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 12 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  actions: { flexDirection: 'row', gap: 40, marginTop: 40 },
  button: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  decline: { backgroundColor: '#dc2626' },
  accept: { backgroundColor: '#16a34a' },
  buttonText: { color: '#fff', fontSize: 26, fontWeight: '700' },
});
