import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'vartakaro.auth';

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,

  // AsyncStorage is async, unlike localStorage, so the store starts empty
  // and this is called once at app startup to load a saved session.
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set(JSON.parse(raw));
    } catch {
      // corrupt/missing storage just means starting logged out
    } finally {
      set({ hydrated: true });
    }
  },

  setAuth: ({ user, accessToken, refreshToken }) => {
    const next = { user, accessToken, refreshToken };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    set(next);
  },

  updateUser: (partial) => {
    const user = { ...get().user, ...partial };
    const next = { user, accessToken: get().accessToken, refreshToken: get().refreshToken };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    set({ user });
  },

  clearAuth: () => {
    AsyncStorage.removeItem(STORAGE_KEY);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
