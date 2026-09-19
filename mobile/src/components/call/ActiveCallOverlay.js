import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import { useCallStore } from '../../store/callStore';
import { endCall, toggleMuted, toggleCamera, switchCamera } from '../../call/webrtc';
import Avatar from '../common/Avatar';

function useDurationTimer(startedAt) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return undefined;
    }
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ActiveCallOverlay() {
  const phase = useCallStore((s) => s.phase);
  const callType = useCallStore((s) => s.callType);
  const remoteUser = useCallStore((s) => s.remoteUser);
  const localStream = useCallStore((s) => s.localStream);
  const remoteStream = useCallStore((s) => s.remoteStream);
  const muted = useCallStore((s) => s.muted);
  const cameraOff = useCallStore((s) => s.cameraOff);
  const startedAt = useCallStore((s) => s.startedAt);
  const elapsed = useDurationTimer(startedAt);

  if (phase !== 'outgoing' && phase !== 'connected') return null;

  const isVideo = callType === 'video';
  const statusText = phase === 'outgoing' ? 'Ringing...' : formatDuration(elapsed);
  const showRemoteVideo = isVideo && remoteStream;

  return (
    <View style={styles.root}>
      {showRemoteVideo ? (
        <RTCView streamURL={remoteStream.toURL()} style={styles.remoteVideo} objectFit="cover" />
      ) : (
        <View style={styles.avatarWrap}>
          <Avatar user={remoteUser} size="lg" />
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.name}>{remoteUser?.name}</Text>
        <Text style={styles.status}>{statusText}</Text>
      </View>

      {isVideo && localStream && (
        <RTCView streamURL={localStream.toURL()} style={styles.localVideo} objectFit="cover" mirror zOrder={1} />
      )}

      <View style={styles.controls}>
        <Pressable onPress={toggleMuted} style={[styles.button, muted && styles.buttonActive]}>
          <Text style={styles.buttonText}>{muted ? '🔇' : '🎙️'}</Text>
        </Pressable>
        {isVideo && (
          <>
            <Pressable onPress={toggleCamera} style={[styles.button, cameraOff && styles.buttonActive]}>
              <Text style={styles.buttonText}>{cameraOff ? '📷' : '🎥'}</Text>
            </Pressable>
            <Pressable onPress={switchCamera} style={styles.button}>
              <Text style={styles.buttonText}>🔄</Text>
            </Pressable>
          </>
        )}
        <Pressable onPress={endCall} style={[styles.button, styles.endButton]}>
          <Text style={styles.buttonText}>📞</Text>
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
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    elevation: 100,
  },
  remoteVideo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  avatarWrap: { alignItems: 'center' },
  header: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', gap: 4 },
  name: { color: '#fff', fontSize: 18, fontWeight: '700' },
  status: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  localVideo: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: '#111',
  },
  controls: { position: 'absolute', bottom: 50, flexDirection: 'row', gap: 18 },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: { backgroundColor: '#fff' },
  endButton: { backgroundColor: '#dc2626' },
  buttonText: { fontSize: 22 },
});
