import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  unreadCount: 0,
  items: null, // null = not yet loaded

  setUnreadCount: (unreadCount) => set({ unreadCount }),

  setItems: (items) => set({ items }),

  addNotification: (notification) =>
    set((state) => ({
      unreadCount: state.unreadCount + 1,
      items: state.items ? [notification, ...state.items] : state.items,
    })),

  markAllRead: () =>
    set((state) => ({
      unreadCount: 0,
      items: state.items ? state.items.map((n) => ({ ...n, read: true })) : state.items,
    })),
}));
