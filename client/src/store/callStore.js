import { create } from 'zustand';

export const useCallStore = create((set) => ({
  phase: 'idle', // idle | outgoing | incoming | resuming | connected | ended
  role: null, // 'caller' | 'callee'
  callType: 'audio', // 'audio' | 'video'
  conversationId: null,
  remoteUserId: null,
  remoteUser: null,
  localStream: null,
  remoteStream: null,
  muted: false,
  cameraOff: false,
  startedAt: null,
  error: null,
  // True on the side that never disconnected, while its peer's page is
  // reloading/reconnecting and the call is being silently renegotiated.
  reconnectingPeer: false,

  setState: (patch) => set(patch),

  reset: () =>
    set({
      phase: 'idle',
      role: null,
      callType: 'audio',
      conversationId: null,
      remoteUserId: null,
      remoteUser: null,
      localStream: null,
      remoteStream: null,
      muted: false,
      cameraOff: false,
      startedAt: null,
      error: null,
      reconnectingPeer: false,
    }),
}));
