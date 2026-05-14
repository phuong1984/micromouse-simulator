import { create } from 'zustand';

type Theme = 'dark' | 'light';

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const STORAGE_KEY = 'micromouse-theme';

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: getInitialTheme(),
  toggle: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    }),
  setTheme: (theme: Theme) => {
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
}));
