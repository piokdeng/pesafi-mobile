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
  account_type?: 'personal' | 'business';
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

// ── Business types ─────────────────────────────────────────────────────────────

export type AccountType = 'personal' | 'business';

export type BusinessProfile = {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  country: string;
  registration_number?: string;
  logo_url?: string;
  created_at: string;
};

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unit_price: number;
};

export type Invoice = {
  id: string;
  business_id: string;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  line_items: InvoiceLineItem[];
  subtotal: number;
  fee_percent: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  due_date: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
};

export type PayrollStatus = 'draft' | 'pending' | 'processing' | 'completed' | 'failed';

export type PayrollRecipient = {
  id: string;
  name: string;
  phone_number?: string;
  wallet_address?: string;
  provider?: MobileMoneyProvider;
  amount_usd: number;
  local_currency?: string;
  status?: 'pending' | 'sent' | 'failed';
};

export type PayrollBatch = {
  id: string;
  business_id: string;
  label: string;
  recipients: PayrollRecipient[];
  total_usd: number;
  status: PayrollStatus;
  scheduled_at?: string;
  completed_at?: string;
  created_at: string;
};

export type TeamRole = 'owner' | 'admin' | 'finance' | 'viewer';

export type TeamMember = {
  id: string;
  business_id: string;
  user_id?: string;
  name: string;
  email: string;
  role: TeamRole;
  status: 'active' | 'pending' | 'removed';
  joined_at?: string;
  invited_at: string;
};

export type PaymentLink = {
  id: string;
  business_id: string;
  label: string;
  amount_usd?: number;
  currency: string;
  description?: string;
  url: string;
  is_active: boolean;
  payments_count: number;
  total_collected: number;
  created_at: string;
};

export type ApiKey = {
  id: string;
  business_id: string;
  label: string;
  key_preview: string;
  environment: 'live' | 'test';
  created_at: string;
  last_used_at?: string;
};

export type BusinessStats = {
  balance: number;
  revenue_this_month: number;
  revenue_last_month: number;
  transactions_this_month: number;
  pending_invoices_count: number;
  pending_invoices_total: number;
};
