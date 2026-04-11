/**
 * South Sudan SSP → USD (USDC) FX helpers for PesaFi.
 * Ported from src/lib/fx-ssp.ts in the web app.
 *
 * Rates are illustrative until wired to a live feed / treasury pricing.
 */

export const SSP_FX_CONFIG = {
  midMarketSspPerUsd: 6200,
  spreadOverMid: 0.175,
  market: 'South Sudan',
  quoteCcy: 'SSP',
  targetCcy: 'USD',
} as const;

export function pesafiSspPerUsd(): number {
  return SSP_FX_CONFIG.midMarketSspPerUsd * (1 + SSP_FX_CONFIG.spreadOverMid);
}

export function sspToUsd(ssp: number): number {
  if (!Number.isFinite(ssp) || ssp <= 0) return 0;
  return ssp / pesafiSspPerUsd();
}

export function usdToSsp(usd: number): number {
  if (!Number.isFinite(usd) || usd <= 0) return 0;
  return usd * pesafiSspPerUsd();
}

export function getPublicFxQuote() {
  const kp = pesafiSspPerUsd();
  const mid = SSP_FX_CONFIG.midMarketSspPerUsd;
  return {
    market: SSP_FX_CONFIG.market,
    midMarketSspPerUsd: mid,
    pesafiSspPerUsd: Math.round(kp),
    spreadOverMidPercent: Math.round(SSP_FX_CONFIG.spreadOverMid * 100),
    updatedAt: new Date().toISOString(),
    disclaimer:
      'Illustrative PesaFi rate for demonstration. The rate at settlement may differ based on liquidity and volatility.',
  };
}

export function formatSsp(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return 'SSP 0';
  return `SSP ${Math.round(amount).toLocaleString('en-US')}`;
}
