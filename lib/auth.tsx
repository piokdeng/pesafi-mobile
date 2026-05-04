import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken } from './api/client';
import type { User, AccountType } from './types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: { email: string; password: string; name: string; phone: string }) => Promise<void>;
  signUpBusiness: (params: { email: string; password: string; name: string; phone: string; businessName: string; businessType: string; country: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapSupabaseUser(u: any): User {
  return {
    id: u.id,
    email: u.email ?? '',
    name: u.user_metadata?.name,
    phone: u.phone ?? u.user_metadata?.phone,
    avatar_url: u.user_metadata?.avatar_url,
    preferred_currency: u.user_metadata?.preferred_currency ?? 'KES',
    account_type: (u.user_metadata?.account_type ?? 'personal') as AccountType,
    has_business_profile: u.user_metadata?.has_business_profile ?? false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(mapSupabaseUser(session.user));
        setToken(session.access_token);
        setAuthToken(session.access_token);
      }
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(mapSupabaseUser(session.user));
        setToken(session.access_token);
        setAuthToken(session.access_token);
      } else {
        setUser(null);
        setToken(null);
        setAuthToken(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signUp = useCallback(async (params: { email: string; password: string; name: string; phone: string }) => {
    const { error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: { data: { name: params.name, phone: params.phone, preferred_currency: 'KES' } },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signUpBusiness = useCallback(async (params: {
    email: string; password: string; name: string; phone: string;
    businessName: string; businessType: string; country: string;
  }) => {
    const { error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          name: params.name,
          phone: params.phone,
          account_type: 'business',
          business_name: params.businessName,
          business_type: params.businessType,
          country: params.country,
          preferred_currency: 'KES',
        },
      },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signUpBusiness, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
