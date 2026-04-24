import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type ThemeMode, themes, setThemeColors } from '@/constants/theme';

type ThemeCtx = {
  mode: ThemeMode;
  colors: typeof themes.dark;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = 'pesafi.theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark') {
        setModeState(saved);
        setThemeColors(saved);
      }
    });
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    setThemeColors(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    const next = mode === 'dark' ? 'light' : 'dark';
    setMode(next);
  }, [mode, setMode]);

  const colors = themes[mode];

  return (
    <ThemeContext.Provider value={{ mode, colors, toggle, setMode, isDark: mode === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
