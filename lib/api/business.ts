/**
 * PesaFi Business API — mock data layer.
 * Real endpoints will replace these once the backend is wired up.
 */

import { supabase } from '../auth';
import type {
  BusinessProfile, BusinessStats, Invoice, PayrollBatch, PayrollRecipient,
  TeamMember, TeamRole, PaymentLink, ApiKey,
} from '../types';

export async function getBusinessProfile(): Promise<BusinessProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('business_profile').select('*').eq('user_id', user.id).maybeSingle();
  return data ?? null;
}

export async function getBusinessStats(): Promise<BusinessStats> {
  return {
    balance: 4280.50,
    revenue_this_month: 1850.00,
    revenue_last_month: 2340.00,
    transactions_this_month: 34,
    pending_invoices_count: 2,
    pending_invoices_total: 620.00,
  };
}

export async function getInvoices(): Promise<Invoice[]> {
  return [
    { id: '1', business_id: 'b1', invoice_number: 'INV-001', client_name: 'Nairobi Coffee Co.', client_email: 'info@nairobicoffee.ke', line_items: [{ description: 'Web design', quantity: 1, unit_price: 400 }], subtotal: 400, fee_percent: 0.5, total: 402, currency: 'USD', status: 'paid', due_date: '2024-04-01', paid_at: '2024-03-28', created_at: '2024-03-15' },
    { id: '2', business_id: 'b1', invoice_number: 'INV-002', client_name: 'Kampala Traders Ltd', client_email: 'billing@kampalatraders.ug', line_items: [{ description: 'Monthly retainer', quantity: 1, unit_price: 300 }, { description: 'Extra hours', quantity: 5, unit_price: 20 }], subtotal: 400, fee_percent: 0.5, total: 402, currency: 'USD', status: 'sent', due_date: '2024-05-15', created_at: '2024-04-20' },
    { id: '3', business_id: 'b1', invoice_number: 'INV-003', client_name: 'Accra Logistics', client_email: 'pay@accralogistics.gh', line_items: [{ description: 'Delivery software licence', quantity: 1, unit_price: 220 }], subtotal: 220, fee_percent: 0.5, total: 221.1, currency: 'USD', status: 'overdue', due_date: '2024-03-31', created_at: '2024-03-01' },
    { id: '4', business_id: 'b1', invoice_number: 'INV-004', client_name: 'Lagos Fintech Hub', line_items: [{ description: 'Consulting session', quantity: 3, unit_price: 80 }], subtotal: 240, fee_percent: 0.5, total: 241.2, currency: 'USD', status: 'draft', due_date: '2024-06-01', created_at: '2024-04-28' },
  ];
}

export async function createInvoice(data: Partial<Invoice>): Promise<Invoice> {
  const subtotal = (data.line_items ?? []).reduce((s, li) => s + li.quantity * li.unit_price, 0);
  const fee = subtotal * 0.005;
  return {
    id: Date.now().toString(),
    business_id: 'b1',
    invoice_number: `INV-${String(Math.floor(Math.random() * 900) + 100)}`,
    client_name: data.client_name ?? '',
    client_email: data.client_email,
    client_phone: data.client_phone,
    line_items: data.line_items ?? [],
    subtotal,
    fee_percent: 0.5,
    total: subtotal + fee,
    currency: 'USD',
    status: data.status ?? 'sent',
    due_date: data.due_date ?? new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    notes: data.notes,
    created_at: new Date().toISOString(),
  };
}

export async function getPayrollBatches(): Promise<PayrollBatch[]> {
  return [
    { id: 'p1', business_id: 'b1', label: 'April 2024 Payroll', recipients: [{ id: 'r1', name: 'Jane Achieng', phone_number: '+254712345678', provider: 'MPESA', amount_usd: 150, local_currency: 'KES', status: 'sent' }, { id: 'r2', name: 'David Okello', phone_number: '+256701234567', provider: 'MTN', amount_usd: 120, local_currency: 'UGX', status: 'sent' }, { id: 'r3', name: 'Grace Wanjiku', phone_number: '+254723456789', provider: 'MPESA', amount_usd: 130, local_currency: 'KES', status: 'sent' }], total_usd: 400, status: 'completed', completed_at: '2024-04-30T10:00:00Z', created_at: '2024-04-30T09:00:00Z' },
    { id: 'p2', business_id: 'b1', label: 'May 2024 Payroll', recipients: [{ id: 'r4', name: 'Jane Achieng', phone_number: '+254712345678', provider: 'MPESA', amount_usd: 150, local_currency: 'KES', status: 'pending' }, { id: 'r5', name: 'David Okello', phone_number: '+256701234567', provider: 'MTN', amount_usd: 120, local_currency: 'UGX', status: 'pending' }], total_usd: 270, status: 'draft', created_at: '2024-05-01T08:00:00Z' },
  ];
}

export async function createPayrollBatch(data: { label: string; recipients: PayrollRecipient[] }): Promise<PayrollBatch> {
  return {
    id: Date.now().toString(),
    business_id: 'b1',
    label: data.label,
    recipients: data.recipients,
    total_usd: data.recipients.reduce((s, r) => s + r.amount_usd, 0),
    status: 'completed',
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  return [
    { id: 'm1', business_id: 'b1', name: 'You (Owner)', email: '', role: 'owner', status: 'active', joined_at: '2024-01-01T00:00:00Z', invited_at: '2024-01-01T00:00:00Z' },
    { id: 'm2', business_id: 'b1', name: 'Sarah Kimani', email: 'sarah@example.com', role: 'finance', status: 'active', joined_at: '2024-02-10T00:00:00Z', invited_at: '2024-02-08T00:00:00Z' },
    { id: 'm3', business_id: 'b1', name: 'Brian Omondi', email: 'brian@example.com', role: 'viewer', status: 'pending', invited_at: '2024-04-25T00:00:00Z' },
  ];
}

export async function inviteTeamMember(data: { name: string; email: string; role: TeamRole }): Promise<TeamMember> {
  return {
    id: Date.now().toString(),
    business_id: 'b1',
    name: data.name,
    email: data.email,
    role: data.role,
    status: 'pending',
    invited_at: new Date().toISOString(),
  };
}

export async function getPaymentLinks(): Promise<PaymentLink[]> {
  return [
    { id: 'l1', business_id: 'b1', label: 'General payment', currency: 'USD', url: 'https://pay.pesafi.ai/p/general-abc123', is_active: true, payments_count: 12, total_collected: 840, created_at: '2024-03-01T00:00:00Z' },
    { id: 'l2', business_id: 'b1', label: 'Invoice deposit (50%)', amount_usd: 200, currency: 'USD', description: '50% deposit for web project', url: 'https://pay.pesafi.ai/p/deposit-xyz789', is_active: true, payments_count: 3, total_collected: 600, created_at: '2024-04-10T00:00:00Z' },
  ];
}

export async function createPaymentLink(data: { label: string; amount_usd?: number; description?: string }): Promise<PaymentLink> {
  const slug = data.label.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).slice(2, 8);
  return {
    id: Date.now().toString(),
    business_id: 'b1',
    label: data.label,
    amount_usd: data.amount_usd,
    currency: 'USD',
    description: data.description,
    url: `https://pay.pesafi.ai/p/${slug}`,
    is_active: true,
    payments_count: 0,
    total_collected: 0,
    created_at: new Date().toISOString(),
  };
}

export async function getApiKeys(): Promise<ApiKey[]> {
  return [
    { id: 'k1', business_id: 'b1', label: 'Production server', key_preview: 'pk_live_••••••••••••3f9a', environment: 'live', created_at: '2024-03-01T00:00:00Z', last_used_at: '2024-04-29T14:23:00Z' },
    { id: 'k2', business_id: 'b1', label: 'Local dev', key_preview: 'pk_test_••••••••••••7b2c', environment: 'test', created_at: '2024-03-01T00:00:00Z', last_used_at: '2024-04-28T09:10:00Z' },
  ];
}

export async function createApiKey(label: string, environment: 'live' | 'test'): Promise<ApiKey> {
  const prefix = environment === 'live' ? 'pk_live_' : 'pk_test_';
  const suffix = Math.random().toString(36).slice(2, 6);
  return {
    id: Date.now().toString(),
    business_id: 'b1',
    label,
    key_preview: `${prefix}••••••••••••${suffix}`,
    environment,
    created_at: new Date().toISOString(),
  };
}
