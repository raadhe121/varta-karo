import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices } from 'react-native-webrtc';
import { getSocket } from '../socket/socket';
import { useCallStore } from '../store/callStore';
import { logCall } from '../api/calls.api';
import { startRingtone, stopRingtone } from './ringtone';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

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
      socket()?.emit('call:ice-candidate', { toUserId, candidate: event.candidate });
    }
  };

  connection.ontrack = (event) => {
    useCallStore.getState().setState({ remoteStream: event.streams[0] });
  };

  connection.onconnectionstatechange = () => {
    if (['failed', 'closed'].includes(connection.connectionState) && useCallStore.getState().phase === 'connected') {
      endCall();
    }
  };

  return connection;
}

async function getLocalMedia(callType) {
  return mediaDevices.getUserMedia({
    audio: true,
    video: callType === 'video' ? { frameRate: 30, facingMode: 'user' } : false,
  });
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
    startRingtone({ outgoing: true });
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
  startRingtone({ outgoing: false });
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

export function switchCamera() {
  const { localStream } = useCallStore.getState();
  const videoTrack = localStream?.getVideoTracks()?.[0];
  videoTrack?._switchCamera?.();
}
