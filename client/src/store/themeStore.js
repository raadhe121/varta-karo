import { create } from 'zustand';
import { applyTheme, getStoredTheme } from '../utils/theme';

export const useThemeStore = create((set, get) => ({
  theme: getStoredTheme(),

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    set({ theme: next });
  },
}));
