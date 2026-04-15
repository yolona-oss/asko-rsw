'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { storage, STORAGE_KEYS } from './storage';

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme {
  const stored = storage.get(STORAGE_KEYS.theme) as Theme | null;
  if (stored === 'dark' || stored === 'light') return stored;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  // Apply class + persist
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    storage.set(STORAGE_KEYS.theme, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
