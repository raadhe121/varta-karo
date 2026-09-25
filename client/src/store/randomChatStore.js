import { create } from 'zustand';

/** Session state for the floating random-chat widget — deliberately separate
 * from `chatStore` (real, persisted conversations): this tracks the one
 * ephemeral random-chat session, if any, so it survives the popup being
 * minimized (closed via the X, not "End Chat") and can be resumed by
 * clicking the "Anonymous" entry Sidebar shows while a session is active. */
export const useRandomChatStore = create((set) => ({
  visible: false,
  sessionActive: false,
  phase: 'idle', // idle | waiting | chatting | ended
  endedBy: null, // 'self' | 'partner' | null
  partner: null,
  messages: [],
  requestState: 'none', // none | pending | sent
  hasPendingRequest: false,
  conversationId: null,

  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),

  startSession: () => set({ sessionActive: true, visible: true, phase: 'idle', endedBy: null }),

  setWaiting: () => set({ phase: 'waiting' }),
  setMatched: (partner) =>
    set({ phase: 'chatting', partner, messages: [], requestState: 'none', hasPendingRequest: false, conversationId: null, endedBy: null }),
  addIncomingMessage: (text, at) =>
    set((s) => ({ messages: [...s.messages, { fromSelf: false, text, at }] })),
  addOwnMessage: (text) =>
    set((s) => ({ messages: [...s.messages, { fromSelf: true, text, at: new Date().toISOString() }] })),
  // Chat ended for either party — whoever ended it ('self' or 'partner'),
  // both sides land here so the widget can show a shared "chat ended" state
  // instead of silently reverting to idle.
  chatEnded: (endedBy) => set({ phase: 'ended', endedBy, hasPendingRequest: false }),
  setRequestState: (pending) => set({ requestState: pending ? 'pending' : 'sent' }),
  setPendingRequest: () => set({ hasPendingRequest: true }),
  setConversationId: (conversationId) => set({ conversationId }),

  resetForNext: () =>
    set({ phase: 'waiting', partner: null, messages: [], requestState: 'none', hasPendingRequest: false, conversationId: null, endedBy: null }),

  endSession: () =>
    set({
      visible: false,
      sessionActive: false,
      phase: 'idle',
      endedBy: null,
      partner: null,
      messages: [],
      requestState: 'none',
      hasPendingRequest: false,
      conversationId: null,
    }),
}));
