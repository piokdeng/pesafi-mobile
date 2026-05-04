/**
 * PesaFi Business API
 * Real calls where a Supabase table exists; mock data elsewhere while the
 * backend endpoints are being built.
 */

import { supabase } from '../auth';
import type {
  BusinessProfile,
  BusinessStats,
  Invoice,
  InvoiceLineItem,
  PayrollBatch,
  PayrollRecipient,
  TeamMember,
  TeamRole,
  PaymentLink,
  ApiKey,
} from '../types';

// ── helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function iso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

const MOCK_BUSINESS_ID = 'biz_mock_001';

// ── Business Profile ──────────────────────────────────────────────────────────

export async function getBusinessProfile(): Promise<BusinessProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('business_profile')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.warn('[business] getBusinessProfile error:', error.message);
    return null;
  }
  return data as BusinessProfile | null;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getBusinessStats(): Promise<BusinessStats> {
  // Mock — replace with a real aggregation endpoint when available.
  return {
    balance: 4_820.5,
    revenue_this_month: 12_340.0,
    revenue_last_month: 9_875.25,
    transactions_this_month: 47,
    pending_invoices_count: 3,
    pending_invoices_total: 2_150.0,
  };
}

// ── Invoices ──────────────────────────────────────────────────────────────────

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv_001',
    business_id: MOCK_BUSINESS_ID,
    invoice_number: 'INV-2024-001',
    client_name: 'Karibu Supermarket Ltd',
    client_email: 'accounts@karibusupermarket.co.ke',
    client_phone: '+254712345678',
    line_items: [
      { description: 'Wholesale stock supply – March', quantity: 1, unit_price: 850.0 },
      { description: 'Delivery & handling', quantity: 1, unit_price: 45.0 },
    ] as InvoiceLineItem[],
    subtotal: 895.0,
    fee_percent: 0.5,
    total: 899.48,
    currency: 'USD',
    status: 'paid',
    due_date: iso(-10),
    paid_at: iso(-8),
    created_at: iso(-20),
  },
  {
    id: 'inv_002',
    business_id: MOCK_BUSINESS_ID,
    invoice_number: 'INV-2024-002',
    client_name: 'Nairobi Tech Hub',
    client_email: 'finance@nairobitecthub.io',
    line_items: [
      { description: 'Software development – April sprint', quantity: 1, unit_price: 1_200.0 },
    ] as InvoiceLineItem[],
    subtotal: 1_200.0,
    fee_percent: 0.5,
    total: 1_206.0,
    currency: 'USD',
    status: 'sent',
    due_date: iso(5),
    notes: 'Please pay via PesaFi payment link.',
    created_at: iso(-5),
  },
  {
    id: 'inv_003',
    business_id: MOCK_BUSINESS_ID,
    invoice_number: 'INV-2024-003',
    client_name: 'Kampala Fresh Produce',
    client_phone: '+256701234567',
    line_items: [
      { description: 'Consulting – supply chain audit', quantity: 3, unit_price: 150.0 },
    ] as InvoiceLineItem[],
    subtotal: 450.0,
    fee_percent: 0.5,
    total: 452.25,
    currency: 'USD',
    status: 'overdue',
    due_date: iso(-3),
    created_at: iso(-18),
  },
  {
    id: 'inv_004',
    business_id: MOCK_BUSINESS_ID,
    invoice_number: 'INV-2024-004',
    client_name: 'Mama Mboga Store',
    client_phone: '+255789123456',
    line_items: [
      { description: 'Point-of-sale integration', quantity: 1, unit_price: 300.0 },
      { description: 'Monthly support fee', quantity: 1, unit_price: 50.0 },
    ] as InvoiceLineItem[],
    subtotal: 350.0,
    fee_percent: 0.5,
    total: 351.75,
    currency: 'USD',
    status: 'draft',
    due_date: iso(14),
    created_at: iso(-1),
  },
];

export async function getInvoices(): Promise<Invoice[]> {
  return MOCK_INVOICES;
}

export async function createInvoice(data: Partial<Invoice>): Promise<Invoice> {
  const now = new Date().toISOString();
  const lineItems: InvoiceLineItem[] = data.line_items ?? [];
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const feePercent = data.fee_percent ?? 0.5;
  const total = subtotal * (1 + feePercent / 100);

  const invoice: Invoice = {
    id: 'inv_' + uid(),
    business_id: data.business_id ?? MOCK_BUSINESS_ID,
    invoice_number: 'INV-' + Date.now().toString().slice(-6),
    client_name: data.client_name ?? '',
    client_email: data.client_email,
    client_phone: data.client_phone,
    line_items: lineItems,
    subtotal,
    fee_percent: feePercent,
    total: Math.round(total * 100) / 100,
    currency: data.currency ?? 'USD',
    status: 'draft',
    due_date: data.due_date ?? iso(14),
    notes: data.notes,
    created_at: now,
  };
  return invoice;
}

// ── Payroll ───────────────────────────────────────────────────────────────────

const MOCK_PAYROLL_BATCHES: PayrollBatch[] = [
  {
    id: 'pay_001',
    business_id: MOCK_BUSINESS_ID,
    label: 'April 2024 Payroll',
    recipients: [
      {
        id: 'rec_001',
        name: 'Amina Wanjiru',
        phone_number: '+254723456789',
        provider: 'MPESA',
        amount_usd: 320.0,
        local_currency: 'KES',
        status: 'sent',
      },
      {
        id: 'rec_002',
        name: 'David Ochieng',
        phone_number: '+254734567890',
        provider: 'MPESA',
        amount_usd: 280.0,
        local_currency: 'KES',
        status: 'sent',
      },
      {
        id: 'rec_003',
        name: 'Grace Nakato',
        phone_number: '+256712345678',
        provider: 'MTN',
        amount_usd: 250.0,
        local_currency: 'UGX',
        status: 'sent',
      },
    ] as PayrollRecipient[],
    total_usd: 850.0,
    status: 'completed',
    completed_at: iso(-2),
    created_at: iso(-5),
  },
  {
    id: 'pay_002',
    business_id: MOCK_BUSINESS_ID,
    label: 'May 2024 Payroll',
    recipients: [
      {
        id: 'rec_004',
        name: 'Amina Wanjiru',
        phone_number: '+254723456789',
        provider: 'MPESA',
        amount_usd: 320.0,
        local_currency: 'KES',
        status: 'pending',
      },
      {
        id: 'rec_005',
        name: 'David Ochieng',
        phone_number: '+254734567890',
        provider: 'MPESA',
        amount_usd: 280.0,
        local_currency: 'KES',
        status: 'pending',
      },
      {
        id: 'rec_006',
        name: 'Grace Nakato',
        phone_number: '+256712345678',
        provider: 'MTN',
        amount_usd: 250.0,
        local_currency: 'UGX',
        status: 'pending',
      },
    ] as PayrollRecipient[],
    total_usd: 850.0,
    status: 'draft',
    created_at: iso(0),
  },
];

export async function getPayrollBatches(): Promise<PayrollBatch[]> {
  return MOCK_PAYROLL_BATCHES;
}

export async function createPayrollBatch(data: {
  label: string;
  recipients: PayrollRecipient[];
}): Promise<PayrollBatch> {
  const totalUsd = data.recipients.reduce((sum, r) => sum + r.amount_usd, 0);
  const batch: PayrollBatch = {
    id: 'pay_' + uid(),
    business_id: MOCK_BUSINESS_ID,
    label: data.label,
    recipients: data.recipients,
    total_usd: Math.round(totalUsd * 100) / 100,
    status: 'draft',
    created_at: new Date().toISOString(),
  };
  return batch;
}

// ── Team ──────────────────────────────────────────────────────────────────────

const MOCK_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm_001',
    business_id: MOCK_BUSINESS_ID,
    name: 'Kamau Njoroge',
    email: 'kamau@pesafi.ai',
    role: 'owner',
    status: 'active',
    joined_at: iso(-120),
    invited_at: iso(-121),
  },
  {
    id: 'tm_002',
    business_id: MOCK_BUSINESS_ID,
    name: 'Fatuma Achieng',
    email: 'fatuma@example.co.ke',
    role: 'finance',
    status: 'active',
    joined_at: iso(-30),
    invited_at: iso(-32),
  },
  {
    id: 'tm_003',
    business_id: MOCK_BUSINESS_ID,
    name: 'Brian Otieno',
    email: 'brian.otieno@example.com',
    role: 'viewer',
    status: 'pending',
    invited_at: iso(-2),
  },
];

export async function getTeamMembers(): Promise<TeamMember[]> {
  return MOCK_TEAM_MEMBERS;
}

export async function inviteTeamMember(data: {
  name: string;
  email: string;
  role: TeamRole;
}): Promise<TeamMember> {
  const member: TeamMember = {
    id: 'tm_' + uid(),
    business_id: MOCK_BUSINESS_ID,
    name: data.name,
    email: data.email,
    role: data.role,
    status: 'pending',
    invited_at: new Date().toISOString(),
  };
  return member;
}

// ── Payment Links ─────────────────────────────────────────────────────────────

const MOCK_PAYMENT_LINKS: PaymentLink[] = [
  {
    id: 'pl_001',
    business_id: MOCK_BUSINESS_ID,
    label: 'General payment',
    currency: 'USD',
    description: 'Pay Mama Mboga Store via PesaFi',
    url: 'https://pay.pesafi.ai/l/mama-mboga',
    is_active: true,
    payments_count: 14,
    total_collected: 1_240.5,
    created_at: iso(-60),
  },
  {
    id: 'pl_002',
    business_id: MOCK_BUSINESS_ID,
    label: 'April invoice',
    amount_usd: 450.0,
    currency: 'USD',
    description: 'Fixed-amount link for Kampala Fresh Produce',
    url: 'https://pay.pesafi.ai/l/apr-invoice',
    is_active: true,
    payments_count: 1,
    total_collected: 450.0,
    created_at: iso(-15),
  },
];

export async function getPaymentLinks(): Promise<PaymentLink[]> {
  return MOCK_PAYMENT_LINKS;
}

export async function createPaymentLink(data: {
  label: string;
  amount_usd?: number;
  description?: string;
}): Promise<PaymentLink> {
  const slug = data.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + uid();
  const link: PaymentLink = {
    id: 'pl_' + uid(),
    business_id: MOCK_BUSINESS_ID,
    label: data.label,
    amount_usd: data.amount_usd,
    currency: 'USD',
    description: data.description,
    url: `https://pay.pesafi.ai/l/${slug}`,
    is_active: true,
    payments_count: 0,
    total_collected: 0,
    created_at: new Date().toISOString(),
  };
  return link;
}

// ── API Keys ──────────────────────────────────────────────────────────────────

const MOCK_API_KEYS: ApiKey[] = [
  {
    id: 'key_001',
    business_id: MOCK_BUSINESS_ID,
    label: 'Production integration',
    key_preview: 'pk_live_••••••••3f9a',
    environment: 'live',
    created_at: iso(-45),
    last_used_at: iso(-1),
  },
  {
    id: 'key_002',
    business_id: MOCK_BUSINESS_ID,
    label: 'Test environment',
    key_preview: 'pk_test_••••••••7c2b',
    environment: 'test',
    created_at: iso(-45),
    last_used_at: iso(-7),
  },
];

export async function getApiKeys(): Promise<ApiKey[]> {
  return MOCK_API_KEYS;
}

export async function createApiKey(
  label: string,
  environment: 'live' | 'test'
): Promise<ApiKey> {
  const suffix = uid().slice(0, 4);
  const prefix = environment === 'live' ? 'pk_live_' : 'pk_test_';
  const key: ApiKey = {
    id: 'key_' + uid(),
    business_id: MOCK_BUSINESS_ID,
    label,
    key_preview: `${prefix}••••••••${suffix}`,
    environment,
    created_at: new Date().toISOString(),
  };
  return key;
}
