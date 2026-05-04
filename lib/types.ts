/**
 * Shared types - mirror the Supabase tables and API responses from
 * the PesaFi Next.js backend.
 */

export type User = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar_url?: string;
  preferred_currency?: string;
  has_business_profile?: boolean;
};

export type Wallet = {
  user_id: string;
  address: string;
  balance: number;          // USDC balance in USD
  chain_id: number;
  wallet_type: 'personal' | 'business';
};

export type TransactionType = 'send' | 'receive' | 'deposit' | 'withdrawal';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type Transaction = {
  id: string;
  user_id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;             // numeric string from db
  currency: 'USDC' | 'USD';
  from_address?: string | null;
  to_address?: string | null;
  tx_hash?: string | null;
  category?: 'kotani_pay' | 'coinbase' | 'transak' | 'yellow_card' | 'base' | 'internal' | null;
  created_at: string;
  metadata?: {
    recipientAddress?: string;
    senderAddress?: string;
    phoneNumber?: string;
    destination?: string;
    accountName?: string;
    provider?: string;
    localAmount?: number;
    localCurrency?: string;
  };
};

export type Contact = {
  id: string;
  user_id: string;
  name: string;
  phone_number?: string | null;
  wallet_address?: string | null;
  is_favorite: boolean;
  source?: 'manual' | 'transaction' | 'import';
  created_at: string;
};

export type UserPreferences = {
  preferred_currency: string;       // KES, UGX, NGN, GHS, USD...
  hide_usd_balance: boolean;
  hide_local_amount: boolean;
  anonymize_address: boolean;
  show_balance: boolean;
  show_activity: boolean;
};

export type MobileMoneyProvider = 'MPESA' | 'MTN' | 'AIRTEL';

export type SendMobileMoneyRequest = {
  amountUsd: number;
  phoneNumber: string;
  provider: MobileMoneyProvider;
  accountName: string;
  localCurrency: string;
};
