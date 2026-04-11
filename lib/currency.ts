/**
 * Currency + phone helpers.
 * Mirrors the logic from src/lib/mobile-money-validation.ts in the web app.
 */

import type { MobileMoneyProvider } from './types';

// Approximate FX rates (USD -> local). In production these come from
// the /api/currency-rates endpoint or a service like exchangerate.host.
const FX_RATES: Record<string, number> = {
  USD: 1,
  KES: 129.5,   // Kenyan Shilling
  UGX: 3780,    // Ugandan Shilling
  TZS: 2510,    // Tanzanian Shilling
  NGN: 1580,    // Nigerian Naira
  GHS: 15.2,    // Ghanaian Cedi
  ZAR: 18.4,    // South African Rand
  RWF: 1340,
  SSP: 7285,  // PesaFi rate (6200 mid × 1.175 spread)    // Rwandan Franc
};

export const SUPPORTED_CURRENCIES = Object.keys(FX_RATES);

export function convertUsdToLocal(usd: number, currency: string): number {
  const rate = FX_RATES[currency] ?? 1;
  return usd * rate;
}

export function convertLocalToUsd(local: number, currency: string): number {
  const rate = FX_RATES[currency] ?? 1;
  return local / rate;
}

export function formatUsd(amount: number, hide = false): string {
  if (hide) return '$****';
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatLocal(usd: number, currency: string, hide = false): string {
  if (hide) return `${currency} ****`;
  const local = convertUsdToLocal(usd, currency);
  // Most African currencies don't show decimals for normal display
  const showDecimals = currency === 'USD' || currency === 'GHS' || currency === 'ZAR';
  const formatted = local.toLocaleString('en-US', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
  return `${currency} ${formatted}`;
}

/**
 * Detect currency + provider from a phone number's country code.
 * Mirrors detectCurrencyFromPhone / detectCountryFromPhone from web.
 */
export function detectCountryFromPhone(phone: string): {
  country: string;
  currency: string;
  provider: MobileMoneyProvider;
} | null {
  const cleaned = phone.replace(/\s+/g, '').replace(/^\+/, '');

  if (cleaned.startsWith('254')) return { country: 'Kenya',    currency: 'KES', provider: 'MPESA' };
  if (cleaned.startsWith('256')) return { country: 'Uganda',   currency: 'UGX', provider: 'MTN' };
  if (cleaned.startsWith('255')) return { country: 'Tanzania', currency: 'TZS', provider: 'MPESA' };
  if (cleaned.startsWith('234')) return { country: 'Nigeria',  currency: 'NGN', provider: 'MTN' };
  if (cleaned.startsWith('233')) return { country: 'Ghana',    currency: 'GHS', provider: 'MTN' };
  if (cleaned.startsWith('250')) return { country: 'Rwanda',   currency: 'RWF', provider: 'MTN' };
  if (cleaned.startsWith('27'))  return { country: 'South Africa', currency: 'ZAR', provider: 'MTN' };

  return null;
}

export function truncateAddress(address?: string | null): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}
