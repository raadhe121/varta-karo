import { create } from 'zustand';

const STORAGE_KEY = 'vartakaro.auth';

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { user: null, accessToken: null, refreshToken: null };
  } catch {
    return { user: null, accessToken: null, refreshToken: null };
  }
}

function persist(state, remember) {
  const payload = JSON.stringify({ user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken });
  if (remember) {
    localStorage.setItem(STORAGE_KEY, payload);
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, payload);
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const useAuthStore = create((set, get) => ({
  ...loadInitial(),

  // `remember: false` keeps the session in sessionStorage only, so it clears
  // when the tab/browser closes instead of persisting across restarts.
  setAuth: ({ user, accessToken, refreshToken }, remember = true) => {
    const next = { user, accessToken, refreshToken };
    persist(next, remember);
    set(next);
  },

  updateUser: (partial) => {
    const user = { ...get().user, ...partial };
    const next = { ...get(), user };
    const remember = Boolean(localStorage.getItem(STORAGE_KEY));
    persist(next, remember);
    set({ user });
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
