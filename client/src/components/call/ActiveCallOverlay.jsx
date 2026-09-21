import { useEffect, useRef, useState } from 'react';
import { useCallStore } from '../../store/callStore';
import { endCall, toggleMuted, toggleCamera } from '../../call/webrtc';
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
  const reconnectingPeer = useCallStore((s) => s.reconnectingPeer);
  const elapsed = useDurationTimer(startedAt);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Effects alone can miss a stream: if this component (re)mounts a fresh
  // <video> node while the stream in the store hasn't changed reference,
  // [stream]-keyed effects won't re-fire, leaving the new node's srcObject
  // unset. Callback refs run at commit time for every mount, so they bind
  // whatever stream is current right then regardless of effect deps.
  function bindStream(node, stream, label) {
    if (!node) return;
    // Reassigning srcObject to the stream it already holds restarts loading
    // and aborts any in-flight play() — skip when nothing actually changed.
    if (node.srcObject === (stream || null)) return;
    node.srcObject = stream || null;
    if (stream) {
      node.play().catch((err) => console.warn(`[call] ${label} play() rejected:`, err.name, err.message));
    }
  }

  const setLocalVideoRef = (node) => {
    localVideoRef.current = node;
    bindStream(node, localStream, 'local video');
  };
  const setRemoteVideoRef = (node) => {
    remoteVideoRef.current = node;
    bindStream(node, remoteStream, 'remote video');
  };
  const setRemoteAudioRef = (node) => {
    remoteAudioRef.current = node;
    bindStream(node, remoteStream, 'remote audio');
  };

  useEffect(() => {
    bindStream(localVideoRef.current, localStream, 'local video');
  }, [localStream]);
  useEffect(() => {
    bindStream(remoteVideoRef.current, remoteStream, 'remote video');
    bindStream(remoteAudioRef.current, remoteStream, 'remote audio');
  }, [remoteStream]);

  if (!['outgoing', 'resuming', 'connected'].includes(phase)) return null;

  const isVideo = callType === 'video';
  const statusText =
    phase === 'outgoing'
      ? 'Ringing...'
      : phase === 'resuming'
        ? 'Reconnecting...'
        : reconnectingPeer
          ? `${remoteUser?.name || 'They'} are reconnecting...`
          : formatDuration(elapsed);
  const showRemoteVideo = isVideo && remoteStream;

  return (
    <div className="fixed inset-0 z-[60] bg-ink flex flex-col items-center justify-center text-white">
      {showRemoteVideo ? (
        <video ref={setRemoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-contain bg-black" />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <audio ref={setRemoteAudioRef} autoPlay />
          <Avatar user={remoteUser} size="lg" />
        </div>
      )}

      <div className="absolute top-8 left-0 right-0 flex flex-col items-center gap-1">
        <p className="text-lg font-semibold drop-shadow">{remoteUser?.name}</p>
        <p className="text-sm text-white/80">{statusText}</p>
      </div>

      {isVideo && (
        <video
          ref={setLocalVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-28 right-6 w-28 h-40 object-cover rounded-xl border-2 border-white/30 bg-black"
        />
      )}

      <div className="absolute bottom-10 flex items-center gap-5">
        <button
          onClick={toggleMuted}
          className={`h-14 w-14 rounded-full flex items-center justify-center text-xl ${muted ? 'bg-white text-ink' : 'bg-white/20'}`}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🎙️'}
        </button>
        {isVideo && (
          <button
            onClick={toggleCamera}
            className={`h-14 w-14 rounded-full flex items-center justify-center text-xl ${cameraOff ? 'bg-white text-ink' : 'bg-white/20'}`}
            title={cameraOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {cameraOff ? '📷' : '🎥'}
          </button>
        )}
        <button
          onClick={endCall}
          className="h-14 w-14 rounded-full bg-red-600 flex items-center justify-center text-xl"
          title="End call"
        >
          📞
        </button>
      </div>
    </div>
  );
}
