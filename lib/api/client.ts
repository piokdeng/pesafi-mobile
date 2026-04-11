/**
 * PesaFi API client.
 *
 * Wraps the Next.js API routes from the web app:
 *   GET    /api/user/wallet
 *   GET    /api/wallet/[userId]/balance
 *   POST   /api/wallet/send
 *   POST   /api/wallet/send-sponsored
 *   GET    /api/wallet/phone/[phone]
 *   GET    /api/transactions/[userId]
 *   POST   /api/auth/signin
 *   POST   /api/auth/signup
 *   GET    /api/user/profile
 *   PUT    /api/user/profile
 *
 * Auth uses the Supabase access token in the Authorization header,
 * which the Next.js routes already validate via supabaseAuthClient.
 *
 * If EXPO_PUBLIC_USE_MOCKS=true (or no API base URL is set), the client
 * returns the mock data from mockData.ts so the UI is fully runnable
 * out of the box.
 */

import Constants from 'expo-constants';
import { mockUser, mockWallet, mockTransactions, mockContacts } from '../mockData';
import type {
  User,
  Wallet,
  Transaction,
  Contact,
  SendMobileMoneyRequest,
} from './types';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || extra.apiBaseUrl || '';

export const USE_MOCKS =
  process.env.EXPO_PUBLIC_USE_MOCKS === 'true' || !API_BASE_URL;

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// Helper for mock latency so the UI feels real
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ----- Auth -----

export async function signIn(email: string, _password: string): Promise<{ user: User; token: string }> {
  if (USE_MOCKS) {
    await sleep(600);
    return { user: { ...mockUser, email }, token: 'mock-token' };
  }
  return request('/api/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password: _password }),
  });
}

export async function signUp(params: {
  email: string;
  password: string;
  name: string;
  phone: string;
}): Promise<{ user: User; token: string }> {
  if (USE_MOCKS) {
    await sleep(800);
    return {
      user: { ...mockUser, email: params.email, name: params.name, phone: params.phone },
      token: 'mock-token',
    };
  }
  return request('/api/auth/signup', { method: 'POST', body: JSON.stringify(params) });
}

export async function signOut(): Promise<void> {
  if (USE_MOCKS) return;
  await request('/api/auth/signout', { method: 'POST' });
}

// ----- Wallet -----

export async function getWallet(walletType: 'personal' | 'business' = 'personal'): Promise<Wallet> {
  if (USE_MOCKS) {
    await sleep(300);
    return { ...mockWallet, wallet_type: walletType };
  }
  return request(`/api/user/wallet?type=${walletType}`);
}

export async function refreshWalletBalance(userId: string): Promise<{ balance: number }> {
  if (USE_MOCKS) {
    await sleep(500);
    return { balance: mockWallet.balance };
  }
  return request(`/api/wallet/${userId}/balance`);
}

export async function lookupWalletByPhone(phone: string): Promise<{ address: string; name: string } | null> {
  if (USE_MOCKS) {
    await sleep(300);
    const contact = mockContacts.find((c) => c.phone_number === phone && c.wallet_address);
    return contact?.wallet_address ? { address: contact.wallet_address, name: contact.name } : null;
  }
  return request(`/api/wallet/phone/${encodeURIComponent(phone)}`);
}

export async function sendUsdc(params: {
  recipientAddress: string;
  amount: number;
}): Promise<{ tx_hash: string }> {
  if (USE_MOCKS) {
    await sleep(1500);
    return { tx_hash: '0x' + Math.random().toString(16).slice(2).padEnd(64, '0') };
  }
  return request('/api/wallet/send-sponsored', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function sendToMobileMoney(params: SendMobileMoneyRequest): Promise<{ reference: string }> {
  if (USE_MOCKS) {
    await sleep(1500);
    return { reference: 'KOTANI-' + Math.random().toString(36).slice(2, 10).toUpperCase() };
  }
  // Wired to Kotani Pay through the web backend
  return request('/api/wallet/send', {
    method: 'POST',
    body: JSON.stringify({ ...params, channel: 'mobile_money' }),
  });
}

// ----- Transactions -----

export async function getTransactions(userId: string): Promise<Transaction[]> {
  if (USE_MOCKS) {
    await sleep(400);
    return mockTransactions;
  }
  return request(`/api/transactions/${userId}`);
}

// ----- Contacts -----

export async function getContacts(): Promise<Contact[]> {
  if (USE_MOCKS) {
    await sleep(300);
    return mockContacts;
  }
  return request('/api/user/contacts');
}

export async function createContact(params: {
  name: string;
  phone_number?: string;
  wallet_address?: string;
}): Promise<Contact> {
  if (USE_MOCKS) {
    await sleep(300);
    return {
      id: 'c_' + Date.now(),
      user_id: mockUser.id,
      name: params.name,
      phone_number: params.phone_number ?? null,
      wallet_address: params.wallet_address ?? null,
      is_favorite: false,
      source: 'manual',
      created_at: new Date().toISOString(),
    };
  }
  return request('/api/user/contacts', { method: 'POST', body: JSON.stringify(params) });
}

export async function deleteContact(id: string): Promise<void> {
  if (USE_MOCKS) {
    await sleep(200);
    return;
  }
  await request(`/api/user/contacts/${id}`, { method: 'DELETE' });
}
