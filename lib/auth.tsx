/**
 * Auth context. Persists session to expo-secure-store.
 * In real use this wraps Supabase Auth via @supabase/supabase-js.
 * For now it uses the API client's mock-friendly signIn/signUp.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { signIn as apiSignIn, signUp as apiSignUp, signOut as apiSignOut, setAuthToken } from './api/client';
import type { User } from './types';

const TOKEN_KEY = 'pesafi.auth.token';
const USER_KEY = 'pesafi.auth.user';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: { email: string; password: string; name: string; phone: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const savedUser = await SecureStore.getItemAsync(USER_KEY);
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          setAuthToken(savedToken);
        }
      } catch (e) {
        console.warn('Failed to restore session', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: u, token: t } = await apiSignIn(email, password);
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
    setAuthToken(t);
    setUser(u);
    setToken(t);
  }, []);

  const signUp = useCallback(async (params: { email: string; password: string; name: string; phone: string }) => {
    const { user: u, token: t } = await apiSignUp(params);
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
    setAuthToken(t);
    setUser(u);
    setToken(t);
  }, []);

  const signOut = useCallback(async () => {
    try { await apiSignOut(); } catch {}
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setAuthToken(null);
    setUser(null);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
