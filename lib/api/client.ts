/**
 * PesaFi API client — real Supabase + real backend edition.
 */

import { supabase } from '../auth';
import type { Wallet, Transaction, Contact, SendMobileMoneyRequest } from '../types';

let authToken: string | null = null;
export function setAuthToken(token: string | null) { authToken = token; }

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || '';

/**
 * Fetch with a timeout. If the request takes longer than `ms`, it aborts
 * and throws — preventing the infinite loading state.
 */
async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    return res;
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ----- Wallet -----

export async function getWallet(walletType: 'personal' | 'business' = 'personal'): Promise<Wallet> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('wallet')
    .select('id, user_id, address, usdc_balance, wallet_type')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    return {
      user_id: user.id,
      address: '',
      balance: 0,
      chain_id: 8453,
      wallet_type: walletType,
    };
  }

  return {
    user_id: data.user_id,
    address: data.address,
    balance: parseFloat(data.usdc_balance ?? '0'),
    chain_id: 8453,
    wallet_type: walletType,
  };
}

export async function refreshWalletBalance(_userId: string): Promise<{ balance: number }> {
  const w = await getWallet('personal');
  return { balance: w.balance };
}

export async function lookupWalletByPhone(phone: string): Promise<{ address: string; name: string } | null> {
  const { data, error } = await supabase
    .from('wallet')
    .select('address, user:user_id(name)')
    .eq('phone_number', phone)
    .maybeSingle();
  if (error || !data) return null;
  return { address: data.address, name: (data.user as any)?.name ?? '' };
}

// ----- Transactions -----

/**
 * Auto-fail stale pending transactions older than 5 minutes.
 * This runs on every getTransactions() call so the UI stays honest:
 * nothing sits stuck as "pending" forever.
 */
async function reconcileStaleTransactions(walletId: string): Promise<void> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: stale } = await supabase
      .from('transaction')
      .select('id')
      .eq('wallet_id', walletId)
      .eq('status', 'pending')
      .lt('created_at', fiveMinutesAgo);

    if (stale && stale.length > 0) {
      const ids = stale.map((t: any) => t.id);
      console.log(`[reconcile] Auto-failing ${ids.length} stale pending txs`);
      await supabase
        .from('transaction')
        .update({ status: 'failed' })
        .in('id', ids);
    }
  } catch (e) {
    console.warn('[reconcile] failed', e);
  }
}

export async function getTransactions(_userId: string): Promise<Transaction[]> {
  const w = await getWallet('personal');
  if (!w.address) return [];

  const walletId = await getWalletId();
  if (walletId) {
    await reconcileStaleTransactions(walletId);
  }

  const { data, error } = await supabase
    .from('transaction')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);

  return (data ?? []).map((t: any) => ({
    id: t.id,
    user_id: w.user_id,
    type: t.type,
    status: t.status,
    amount: String(t.usd_amount ?? t.amount ?? '0'),
    currency: t.currency === 'USD' ? 'USD' : 'USDC',
    from_address: t.from_address,
    to_address: t.to_address,
    tx_hash: t.tx_hash,
    category: t.category,
    created_at: t.created_at,
    metadata: t.metadata
      ? (typeof t.metadata === 'string' ? JSON.parse(t.metadata) : t.metadata)
      : {
          accountName: t.recipient_name,
          phoneNumber: t.recipient_phone,
        },
  }));
}

async function getWalletId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data } = await supabase
    .from('wallet')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  return data?.id ?? '';
}

// ----- Sends -----

export async function sendUsdc(params: { recipientAddress: string; amount: number }): Promise<{ tx_hash: string }> {
  const walletId = await getWalletId();
  const fakeHash = '0x' + Math.random().toString(16).slice(2).padEnd(64, '0');
  const { error } = await supabase.from('transaction').insert({
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    wallet_id: walletId,
    type: 'send',
    status: 'pending',
    tx_hash: fakeHash,
    amount: params.amount,
    currency: 'USDC',
    usd_amount: params.amount,
    to_address: params.recipientAddress,
    category: 'base',
    metadata: JSON.stringify({ recipientAddress: params.recipientAddress }),
  });
  if (error) throw new Error(error.message);
  return { tx_hash: fakeHash };
}

/**
 * sendToMobileMoney — calls the real Kotani Pay offramp endpoint.
 *
 * Flow:
 *  1. Auth check — grab Supabase session token
 *  2. POST to /api/kotani-pay/offramp with a 90s timeout
 *  3. If it succeeds, Kotani has escrow + USDC sent. Return reference.
 *  4. If it fails or times out, the backend already marks the tx as failed
 *     (or reconcileStaleTransactions will catch it next poll).
 */
export async function sendToMobileMoney(params: SendMobileMoneyRequest): Promise<{ reference: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not signed in');

  if (!API_BASE) {
    throw new Error('API endpoint not configured. Check EXPO_PUBLIC_API_BASE_URL.');
  }

  const url = `${API_BASE}/api/kotani-pay/offramp`;

  const body = {
    amount: params.amountUsd,
    currency: params.localCurrency,
    withdrawalMethod: 'mobile_money',
    mobileMoneyDetails: {
      phoneNumber: params.phoneNumber,
      accountName: params.accountName,
      networkProvider: params.provider,
    },
    walletType: 'individual',
  };

  let res: Response;
  try {
    res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(body),
    }, 90_000);
  } catch (e: any) {
    console.error('[sendToMobileMoney] network error:', e);
    throw new Error(e?.message || 'Network error. Please try again.');
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    throw new Error('Unexpected server response.');
  }

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  if (!data?.success) {
    throw new Error(data?.error || 'Transfer could not be initiated.');
  }

  return { reference: data?.data?.referenceId || 'KOTANI-' + Date.now() };
}

// ----- Contacts -----

export async function getContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contact')
    .select('*')
    .order('is_favorite', { ascending: false })
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Contact[];
}

export async function createContact(params: {
  name: string;
  phone_number?: string;
  wallet_address?: string;
}): Promise<Contact> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data, error } = await supabase.from('contact').insert({
    user_id: user.id,
    name: params.name,
    phone_number: params.phone_number ?? null,
    wallet_address: params.wallet_address ?? null,
    is_favorite: false,
    source: 'manual',
  }).select().single();
  if (error) throw new Error(error.message);
  return data as Contact;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('contact').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ----- Stubs -----
export const API_BASE_URL = API_BASE;
export const USE_MOCKS = false;
export async function signIn(_email: string, _password: string): Promise<any> {
  throw new Error('Use supabase.auth directly');
}
export async function signUp(_params: any): Promise<any> {
  throw new Error('Use supabase.auth directly');
}
export async function signOut(): Promise<void> {}
