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
  const elapsed = useDurationTimer(startedAt);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream || null;
  }, [localStream]);
  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream || null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream || null;
  }, [remoteStream]);

  if (phase !== 'outgoing' && phase !== 'connected') return null;

  const isVideo = callType === 'video';
  const statusText = phase === 'outgoing' ? 'Ringing...' : formatDuration(elapsed);
  const showRemoteVideo = isVideo && remoteStream;

  return (
    <div className="fixed inset-0 z-[60] bg-ink flex flex-col items-center justify-center text-white">
      {showRemoteVideo ? (
        <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center gap-3">
          <audio ref={remoteAudioRef} autoPlay />
          <Avatar user={remoteUser} size="lg" />
        </div>
      )}

      <div className="absolute top-8 left-0 right-0 flex flex-col items-center gap-1">
        <p className="text-lg font-semibold drop-shadow">{remoteUser?.name}</p>
        <p className="text-sm text-white/80">{statusText}</p>
      </div>

      {isVideo && (
        <video
          ref={localVideoRef}
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
