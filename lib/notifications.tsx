import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationType = 'deposit' | 'receipt' | 'fx' | 'send' | 'withdrawal' | 'system';

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string;     // ISO
  read: boolean;
  meta?: {
    txId?: string;
    amount?: number;
    currency?: string;
    [k: string]: any;
  };
};

type Ctx = {
  notifications: Notification[];
  unreadCount: number;
  add: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clear: () => void;
};

const NotificationContext = createContext<Ctx | null>(null);
const STORAGE_KEY = 'pesafi.notifications';

// Seed with a few realistic notifications on first run
const SEED: Notification[] = [
  {
    id: 'n_seed_1',
    type: 'system',
    title: 'Welcome to PesaFi',
    body: "Your USDC wallet is ready. Tap Deposit to fund it from your card or bank.",
    createdAt: new Date().toISOString(),
    read: false,
  },
  {
    id: 'n_seed_2',
    type: 'fx',
    title: 'SSP rate updated',
    body: 'PesaFi SSP/USD rate moved to 7,285. Lock in a conversion from the FX tab.',
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    read: false,
  },
];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setNotifications(JSON.parse(raw)); } catch {}
      } else {
        setNotifications(SEED);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED)).catch(() => {});
      }
    });
  }, []);

  const persist = useCallback((next: Notification[]) => {
    setNotifications(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const add = useCallback((n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const nn: Notification = {
      ...n,
      id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => {
      const next = [nn, ...prev].slice(0, 50);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    persist([]);
  }, [persist]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, add, markRead, markAllRead, clear }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be inside NotificationProvider');
  return ctx;
}
