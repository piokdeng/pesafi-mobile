import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Preferences = {
  preferredCurrency: string;
  hideBalance: boolean;
  hideLocalAmount: boolean;
  anonymizeAddress: boolean;
  notifications: boolean;
};

const DEFAULTS: Preferences = {
  preferredCurrency: 'KES',
  hideBalance: false,
  hideLocalAmount: false,
  anonymizeAddress: false,
  notifications: true,
};

type Ctx = {
  prefs: Preferences;
  setPref: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
  toggle: (key: keyof Preferences) => void;
};

const PreferencesContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'pesafi.prefs';

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setPrefs({ ...DEFAULTS, ...JSON.parse(raw) }); } catch {}
      }
    });
  }, []);

  const persist = useCallback((next: Preferences) => {
    setPrefs(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setPref = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      persist({ ...prefs, [key]: value });
    },
    [prefs, persist]
  );

  const toggle = useCallback(
    (key: keyof Preferences) => {
      persist({ ...prefs, [key]: !prefs[key] } as Preferences);
    },
    [prefs, persist]
  );

  return (
    <PreferencesContext.Provider value={{ prefs, setPref, toggle }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
