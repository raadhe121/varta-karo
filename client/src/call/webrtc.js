import { getSocket } from '../socket/socket';
import { useCallStore } from '../store/callStore';
import { logCall } from '../api/calls.api';
import { startRingtone, stopRingtone } from './ringtone';

// STUN alone only works when both peers are behind NATs simple enough to
// allow a direct or hole-punched path. Carrier-grade NAT, mobile data, and
// many corporate/home routers need a relay — without TURN, calls between
// such networks can connect but fail to exchange media (often asymmetrically:
// one side gets a stream, the other gets nothing).
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

let pc = null;
let pendingCandidates = [];
let pendingOffer = null;

function socket() {
  return getSocket();
}

function closePeerConnection() {
  if (pc) {
    pc.onicecandidate = null;
    pc.ontrack = null;
    pc.close();
    pc = null;
  }
  pendingCandidates = [];
  pendingOffer = null;
}

function stopStream(stream) {
  stream?.getTracks().forEach((t) => t.stop());
}

function createPeerConnection(toUserId) {
  const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  connection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('[call] local ICE candidate:', event.candidate.type, event.candidate.protocol);
      socket()?.emit('call:ice-candidate', { toUserId, candidate: event.candidate });
    } else {
      console.log('[call] ICE gathering complete');
    }
  };

  connection.ontrack = (event) => {
    console.log(
      '[call] ontrack fired:',
      event.track.kind,
      'streams:',
      event.streams.length,
      'stream tracks:',
      event.streams[0]?.getTracks().map((t) => `${t.kind}:${t.readyState}:enabled=${t.enabled}`)
    );
    const nextStream = event.streams[0];
    // ontrack fires once per track (audio, then video) and each call can
    // hand back a distinct MediaStream object even for the same underlying
    // stream. Reassigning a <video>/<audio> element's srcObject to a "new"
    // stream aborts any in-flight play() and restarts loading, so only
    // update the store when the stream has actually changed.
    if (useCallStore.getState().remoteStream?.id !== nextStream?.id) {
      useCallStore.getState().setState({ remoteStream: nextStream });
    }
  };

  connection.oniceconnectionstatechange = () => {
    console.log('[call] iceConnectionState:', connection.iceConnectionState);
  };

  connection.onconnectionstatechange = () => {
    console.log('[call] connectionState:', connection.connectionState);
    if (['failed', 'closed'].includes(connection.connectionState) && useCallStore.getState().phase === 'connected') {
      endCall();
    }
  };

  return connection;
}

async function getLocalMedia(callType) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callType === 'video' });
  console.log(
    '[call] local media acquired:',
    stream.getTracks().map((t) => `${t.kind}:${t.readyState}:enabled=${t.enabled}:muted=${t.muted}`)
  );
  return stream;
}

function finalizeAndLog(status) {
  const { role, conversationId, remoteUserId, startedAt } = useCallStore.getState();
  if (role !== 'caller' || !conversationId || !remoteUserId) return;
  const durationSec = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
  logCall({ conversationId, calleeId: remoteUserId, type: useCallStore.getState().callType, status, durationSec }).catch(
    () => {}
  );
}

export async function startCall({ toUserId, conversationId, callType, remoteUser }) {
  if (useCallStore.getState().phase !== 'idle') return;
  try {
    const localStream = await getLocalMedia(callType);
    useCallStore.getState().setState({
      phase: 'outgoing',
      role: 'caller',
      callType,
      conversationId,
      remoteUserId: toUserId,
      remoteUser,
      localStream,
    });

    pc = createPeerConnection(toUserId);
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket()?.emit('call:invite', { toUserId, conversationId, callType, offer });
    startRingtone({ freq1: 440, freq2: 440, onMs: 1000, offMs: 3000 });
  } catch (err) {
    useCallStore.getState().setState({ error: err.message || 'Could not access camera/microphone' });
    useCallStore.getState().reset();
  }
}

export function handleIncoming({ fromUserId, fromUser, conversationId, callType, offer }) {
  if (useCallStore.getState().phase !== 'idle') {
    socket()?.emit('call:decline', { toUserId: fromUserId });
    return;
  }
  pendingOffer = offer;
  useCallStore.getState().setState({
    phase: 'incoming',
    role: 'callee',
    callType,
    conversationId,
    remoteUserId: fromUserId,
    remoteUser: fromUser,
  });
  startRingtone();
}

export async function acceptCall() {
  const { remoteUserId, callType } = useCallStore.getState();
  if (!remoteUserId || !pendingOffer) return;
  stopRingtone();
  try {
    const localStream = await getLocalMedia(callType);
    useCallStore.getState().setState({ localStream });

    pc = createPeerConnection(remoteUserId);
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

    await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
    for (const candidate of pendingCandidates) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    }
    pendingCandidates = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket()?.emit('call:answer', { toUserId: remoteUserId, answer });

    useCallStore.getState().setState({ phase: 'connected', startedAt: Date.now() });
  } catch (err) {
    useCallStore.getState().setState({ error: err.message || 'Could not access camera/microphone' });
    declineCall();
  }
}

export function declineCall() {
  const { remoteUserId } = useCallStore.getState();
  stopRingtone();
  if (remoteUserId) socket()?.emit('call:decline', { toUserId: remoteUserId });
  closePeerConnection();
  stopStream(useCallStore.getState().localStream);
  useCallStore.getState().reset();
}

export function endCall() {
  const { remoteUserId, phase } = useCallStore.getState();
  stopRingtone();
  if (remoteUserId) socket()?.emit('call:end', { toUserId: remoteUserId });
  finalizeAndLog(phase === 'connected' ? 'answered' : 'no_answer');
  closePeerConnection();
  const { localStream, remoteStream } = useCallStore.getState();
  stopStream(localStream);
  stopStream(remoteStream);
  useCallStore.getState().reset();
}

export async function handleAnswered({ answer }) {
  if (!pc) return;
  stopRingtone();
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
  for (const candidate of pendingCandidates) {
    await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
  }
  pendingCandidates = [];
  useCallStore.getState().setState({ phase: 'connected', startedAt: Date.now() });
}

export async function handleIceCandidate({ candidate }) {
  if (pc && pc.remoteDescription) {
    await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
  } else {
    pendingCandidates.push(candidate);
  }
}

export function handleDeclined() {
  stopRingtone();
  finalizeAndLog('declined');
  closePeerConnection();
  stopStream(useCallStore.getState().localStream);
  useCallStore.getState().reset();
}

export function handleEnded() {
  stopRingtone();
  finalizeAndLog(useCallStore.getState().phase === 'connected' ? 'answered' : 'no_answer');
  closePeerConnection();
  const { localStream, remoteStream } = useCallStore.getState();
  stopStream(localStream);
  stopStream(remoteStream);
  useCallStore.getState().reset();
}

export function handleUnavailable() {
  stopRingtone();
  finalizeAndLog('no_answer');
  closePeerConnection();
  stopStream(useCallStore.getState().localStream);
  useCallStore.getState().setState({ error: 'User is unavailable' });
  useCallStore.getState().reset();
}

export function handleCancelRing() {
  stopRingtone();
  closePeerConnection();
  stopStream(useCallStore.getState().localStream);
  useCallStore.getState().reset();
}

export function toggleMuted() {
  const { localStream, muted } = useCallStore.getState();
  localStream?.getAudioTracks().forEach((t) => (t.enabled = muted));
  useCallStore.getState().setState({ muted: !muted });
}

export function toggleCamera() {
  const { localStream, cameraOff } = useCallStore.getState();
  localStream?.getVideoTracks().forEach((t) => (t.enabled = cameraOff));
  useCallStore.getState().setState({ cameraOff: !cameraOff });
}
