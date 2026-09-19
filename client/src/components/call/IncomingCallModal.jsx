import { useCallStore } from '../../store/callStore';
import { acceptCall, declineCall } from '../../call/webrtc';
import Avatar from '../common/Avatar';

export default function IncomingCallModal() {
  const phase = useCallStore((s) => s.phase);
  const remoteUser = useCallStore((s) => s.remoteUser);
  const callType = useCallStore((s) => s.callType);

  if (phase !== 'incoming') return null;

  return (
    <div className="fixed inset-0 z-[60] bg-ink/95 flex flex-col items-center justify-center text-white gap-6">
      <Avatar user={remoteUser} size="lg" />
      <div className="text-center">
        <p className="text-xl font-semibold">{remoteUser?.name}</p>
        <p className="text-sm text-white/70">Incoming {callType === 'video' ? 'video' : 'voice'} call...</p>
      </div>
      <div className="flex items-center gap-10 mt-4">
        <button
          onClick={declineCall}
          className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center text-2xl"
          title="Decline"
        >
          ✕
        </button>
        <button
          onClick={acceptCall}
          className="h-16 w-16 rounded-full bg-emerald-600 flex items-center justify-center text-2xl"
          title="Accept"
        >
          ✓
        </button>
      </div>
    </div>
  );
}
