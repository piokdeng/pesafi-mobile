/**
 * Mock data - lets the app run end-to-end without a configured backend.
 * Set EXPO_PUBLIC_USE_MOCKS=false (or unset) once your API is wired.
 */

import type { Wallet, Transaction, Contact, User } from './types';

export const mockUser: User = {
  id: 'user_demo_001',
  email: 'deng@pesafi.ai',
  name: 'Deng Ajak',
  phone: '+254712345678',
  preferred_currency: 'KES',
  has_business_profile: true,
};

export const mockWallet: Wallet = {
  user_id: 'user_demo_001',
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f5b8E4',
  balance: 482.50,
  chain_id: 8453,
  wallet_type: 'personal',
};

export const mockTransactions: Transaction[] = [
  {
    id: 'tx_001',
    user_id: 'user_demo_001',
    type: 'receive',
    status: 'completed',
    amount: '200.00',
    currency: 'USDC',
    from_address: '0x8a7b9C2D1eF4a5B6c7D8e9F0a1B2c3D4e5F6a7B8',
    category: 'base',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    metadata: { senderAddress: '0x8a7b9C2D1eF4a5B6c7D8e9F0a1B2c3D4e5F6a7B8' },
  },
  {
    id: 'tx_002',
    user_id: 'user_demo_001',
    type: 'withdrawal',
    status: 'completed',
    amount: '45.00',
    currency: 'USDC',
    to_address: null,
    category: 'kotani_pay',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    metadata: {
      phoneNumber: '+254712345678',
      provider: 'MPESA',
      accountName: 'Mary Wanjiku',
      localAmount: 5827.5,
      localCurrency: 'KES',
    },
  },
  {
    id: 'tx_003',
    user_id: 'user_demo_001',
    type: 'deposit',
    status: 'completed',
    amount: '300.00',
    currency: 'USDC',
    category: 'coinbase',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'tx_004',
    user_id: 'user_demo_001',
    type: 'send',
    status: 'completed',
    amount: '15.50',
    currency: 'USDC',
    to_address: '0x1234567890aBcDeF1234567890ABcDef12345678',
    category: 'base',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: 'tx_005',
    user_id: 'user_demo_001',
    type: 'send',
    status: 'pending',
    amount: '8.00',
    currency: 'USDC',
    to_address: '0xaBcDeF1234567890aBcDeF1234567890ABcDef12',
    category: 'base',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

export const mockContacts: Contact[] = [
  {
    id: 'c1',
    user_id: 'user_demo_001',
    name: 'Mary Wanjiku',
    phone_number: '+254712345678',
    is_favorite: true,
    source: 'manual',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c2',
    user_id: 'user_demo_001',
    name: 'James Okello',
    phone_number: '+256772345678',
    wallet_address: '0x8a7b9C2D1eF4a5B6c7D8e9F0a1B2c3D4e5F6a7B8',
    is_favorite: true,
    source: 'manual',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c3',
    user_id: 'user_demo_001',
    name: 'Brenda Achieng',
    phone_number: '+12125551234',
    wallet_address: '0x1234567890aBcDeF1234567890ABcDef12345678',
    is_favorite: false,
    source: 'manual',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c4',
    user_id: 'user_demo_001',
    name: 'Samuel Mwangi',
    phone_number: '+254722123456',
    is_favorite: false,
    source: 'transaction',
    created_at: new Date().toISOString(),
  },
];
