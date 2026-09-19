import { create } from 'zustand';

export const usePresenceStore = create((set, get) => ({
  byUserId: {},

  setPresence: (userId, status, lastSeenAt) =>
    set((state) => ({ byUserId: { ...state.byUserId, [userId]: { status, lastSeenAt } } })),

  seedFromUsers: (users) =>
    set((state) => {
      const next = { ...state.byUserId };
      users.forEach((u) => {
        next[u.id] = { status: u.status, lastSeenAt: u.lastSeenAt };
      });
      return { byUserId: next };
    }),

  isOnline: (userId) => get().byUserId[userId]?.status === 'online',
}));
